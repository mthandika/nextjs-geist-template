'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { isAuthenticated, getProducts } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

export default function QRCodePage() {
  const [products, setProducts] = useState<any[]>([])
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [qrCodeData, setQrCodeData] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadProducts()
    // Set default URL to current domain + menu path
    const defaultUrl = `${window.location.origin}/menu`
    setCustomUrl(defaultUrl)
  }, [router])

  const loadProducts = () => {
    setProducts(getProducts())
  }

  const generateMenuData = () => {
    const menuData = {
      restaurantName: "Sistem Kasir",
      menu: products.map(product => ({
        nama: product.nama,
        harga: product.harga,
        tersedia: product.stok > 0
      })),
      contact: "Hubungi kami untuk pemesanan",
      generatedAt: new Date().toISOString()
    }
    return JSON.stringify(menuData, null, 2)
  }

  const generateQRCode = async (data: string) => {
    try {
      setIsGenerating(true)
      setError('')
      
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeUrl(qrCodeDataURL)
    } catch (err) {
      setError('Gagal membuat QR Code. Silakan coba lagi.')
      console.error('QR Code generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateUrlQR = () => {
    if (!customUrl.trim()) {
      setError('URL tidak boleh kosong')
      return
    }
    generateQRCode(customUrl)
  }

  const handleGenerateMenuQR = () => {
    if (products.length === 0) {
      setError('Tidak ada produk untuk ditampilkan dalam menu')
      return
    }
    const menuData = generateMenuData()
    setQrCodeData(menuData)
    generateQRCode(menuData)
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return
    
    const link = document.createElement('a')
    link.download = 'qr-code-menu.png'
    link.href = qrCodeUrl
    link.click()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                ← Kembali ke Dashboard
              </Link>
              <h1 className="text-2xl font-bold mt-2">Generator QR Code Menu</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Image */}
        <div className="mb-8">
          <img 
            src="https://placehold.co/1200x200?text=Generate+QR+Code+untuk+Menu+Digital" 
            alt="Generate QR Code untuk Menu Digital" 
            onError={(e) => { e.currentTarget.style.display='none'; }} 
            className="w-full rounded-lg object-cover" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Generation Options */}
          <div className="space-y-6">
            {/* URL QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code untuk URL Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customUrl">URL Menu</Label>
                  <Input
                    id="customUrl"
                    type="url"
                    placeholder="https://example.com/menu"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Masukkan URL halaman menu online Anda
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateUrlQR}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? 'Membuat QR Code...' : 'Buat QR Code URL'}
                </Button>
              </CardContent>
            </Card>

            {/* Menu Data QR Code */}
            <Card>
              <CardHeader>
                <CardTitle>QR Code untuk Data Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Buat QR Code yang berisi data menu lengkap dengan harga dan ketersediaan produk
                </p>
                <Button 
                  onClick={handleGenerateMenuQR}
                  disabled={isGenerating || products.length === 0}
                  className="w-full"
                >
                  {isGenerating ? 'Membuat QR Code...' : 'Buat QR Code Menu Data'}
                </Button>
                {products.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Tidak ada produk tersedia. <Link href="/products" className="text-primary hover:underline">Tambahkan produk</Link> terlebih dahulu.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Current Menu Preview */}
            {products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview Menu Saat Ini</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{product.nama}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.stok > 0 ? 'Tersedia' : 'Habis'}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(product.harga)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* QR Code Display */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code yang Dihasilkan</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {qrCodeUrl ? (
                  <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <img 
                        src={qrCodeUrl} 
                        alt="Generated QR Code" 
                        className="mx-auto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Button onClick={downloadQRCode} className="w-full">
                        Download QR Code
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Klik untuk mengunduh QR Code sebagai file PNG
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-32 h-32 mx-auto mb-4 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">📱</span>
                    </div>
                    <p>QR Code akan muncul di sini setelah dibuat</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Data Preview */}
            {qrCodeData && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Menu dalam QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={qrCodeData}
                    readOnly
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Data JSON ini disimpan dalam QR Code dan dapat dibaca oleh aplikasi yang mendukung
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Cara Menggunakan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <h4 className="font-medium">QR Code URL:</h4>
                  <p className="text-muted-foreground">
                    Pelanggan dapat memindai untuk langsung mengakses halaman menu online Anda
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">QR Code Menu Data:</h4>
                  <p className="text-muted-foreground">
                    Berisi data menu lengkap yang dapat dibaca oleh aplikasi khusus atau sistem POS
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Tips:</h4>
                  <ul className="text-muted-foreground list-disc list-inside space-y-1">
                    <li>Cetak QR Code dan letakkan di meja atau area yang mudah diakses</li>
                    <li>Pastikan ukuran QR Code cukup besar untuk dipindai dengan mudah</li>
                    <li>Update QR Code secara berkala jika menu berubah</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
