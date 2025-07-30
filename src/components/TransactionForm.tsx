'use client'

import { useState, useEffect } from 'react'
import { addTransaction, getProducts, type Product } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TransactionFormProps {
  onClose: () => void
}

export default function TransactionForm({ onClose }: TransactionFormProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState({
    productId: '',
    jumlah: '',
    tipe: 'penjualan' as 'pembelian' | 'penjualan',
    status: 'diproses' as 'diproses' | 'menunggu_persetujuan'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    setProducts(getProducts())
  }, [])

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === formData.productId)
      setSelectedProduct(product || null)
    } else {
      setSelectedProduct(null)
    }
  }, [formData.productId, products])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.productId) {
      newErrors.productId = 'Produk harus dipilih'
    }

    if (!formData.jumlah.trim()) {
      newErrors.jumlah = 'Jumlah harus diisi'
    } else if (isNaN(Number(formData.jumlah)) || Number(formData.jumlah) <= 0) {
      newErrors.jumlah = 'Jumlah harus berupa angka positif'
    } else if (selectedProduct && formData.tipe === 'penjualan' && Number(formData.jumlah) > selectedProduct.stok) {
      newErrors.jumlah = `Stok tidak mencukupi. Stok tersedia: ${selectedProduct.stok}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !selectedProduct) {
      return
    }

    setIsLoading(true)

    try {
      const transactionData = {
        productId: formData.productId,
        productName: selectedProduct.nama,
        jumlah: Number(formData.jumlah),
        tipe: formData.tipe,
        status: formData.status,
        total: selectedProduct.harga * Number(formData.jumlah)
      }

      addTransaction(transactionData)
      onClose()
    } catch (error) {
      setErrors({ general: 'Terjadi kesalahan saat menyimpan transaksi' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateTotal = () => {
    if (selectedProduct && formData.jumlah && !isNaN(Number(formData.jumlah))) {
      return selectedProduct.harga * Number(formData.jumlah)
    }
    return 0
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Tambah Transaksi Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Produk</Label>
              <Select 
                value={formData.productId} 
                onValueChange={(value) => handleInputChange('productId', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nama} - {formatCurrency(product.harga)} (Stok: {product.stok})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && (
                <p className="text-sm text-destructive">{errors.productId}</p>
              )}
            </div>

            {selectedProduct && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Produk:</strong> {selectedProduct.nama}<br />
                  <strong>Harga:</strong> {formatCurrency(selectedProduct.harga)}<br />
                  <strong>Stok Tersedia:</strong> {selectedProduct.stok}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah</Label>
              <Input
                id="jumlah"
                type="number"
                placeholder="Masukkan jumlah"
                value={formData.jumlah}
                onChange={(e) => handleInputChange('jumlah', e.target.value)}
                disabled={isLoading}
                min="1"
                max={selectedProduct && formData.tipe === 'penjualan' ? selectedProduct.stok : undefined}
              />
              {errors.jumlah && (
                <p className="text-sm text-destructive">{errors.jumlah}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipe Transaksi</Label>
              <RadioGroup
                value={formData.tipe}
                onValueChange={(value) => handleInputChange('tipe', value)}
                disabled={isLoading}
                className="flex flex-row space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="penjualan" id="penjualan" />
                  <Label htmlFor="penjualan">Penjualan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pembelian" id="pembelian" />
                  <Label htmlFor="pembelian">Pembelian</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value as 'diproses' | 'menunggu_persetujuan')}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diproses">Diproses</SelectItem>
                  <SelectItem value="menunggu_persetujuan">Menunggu Persetujuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {calculateTotal() > 0 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium">
                  <strong>Total: {formatCurrency(calculateTotal())}</strong>
                </p>
              </div>
            )}

            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading || products.length === 0}
                className="flex-1"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>

            {products.length === 0 && (
              <Alert>
                <AlertDescription>
                  Tidak ada produk tersedia. Tambahkan produk terlebih dahulu sebelum membuat transaksi.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
