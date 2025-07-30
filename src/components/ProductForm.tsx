'use client'

import { useState, useEffect } from 'react'
import { addProduct, updateProduct, type Product } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProductFormProps {
  product?: Product | null
  onClose: () => void
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    nama: '',
    harga: '',
    stok: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        nama: product.nama,
        harga: product.harga.toString(),
        stok: product.stok.toString()
      })
    }
  }, [product])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama produk harus diisi'
    }

    if (!formData.harga.trim()) {
      newErrors.harga = 'Harga harus diisi'
    } else if (isNaN(Number(formData.harga)) || Number(formData.harga) <= 0) {
      newErrors.harga = 'Harga harus berupa angka positif'
    }

    if (!formData.stok.trim()) {
      newErrors.stok = 'Stok harus diisi'
    } else if (isNaN(Number(formData.stok)) || Number(formData.stok) < 0) {
      newErrors.stok = 'Stok harus berupa angka non-negatif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const productData = {
        nama: formData.nama.trim(),
        harga: Number(formData.harga),
        stok: Number(formData.stok)
      }

      if (product) {
        // Update existing product
        updateProduct(product.id, productData)
      } else {
        // Add new product
        addProduct(productData)
      }

      onClose()
    } catch (error) {
      setErrors({ general: 'Terjadi kesalahan saat menyimpan produk' })
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {product ? 'Edit Produk' : 'Tambah Produk Baru'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Produk</Label>
              <Input
                id="nama"
                type="text"
                placeholder="Masukkan nama produk"
                value={formData.nama}
                onChange={(e) => handleInputChange('nama', e.target.value)}
                disabled={isLoading}
              />
              {errors.nama && (
                <p className="text-sm text-destructive">{errors.nama}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="harga">Harga (Rp)</Label>
              <Input
                id="harga"
                type="number"
                placeholder="Masukkan harga"
                value={formData.harga}
                onChange={(e) => handleInputChange('harga', e.target.value)}
                disabled={isLoading}
                min="0"
                step="100"
              />
              {errors.harga && (
                <p className="text-sm text-destructive">{errors.harga}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stok">Stok</Label>
              <Input
                id="stok"
                type="number"
                placeholder="Masukkan jumlah stok"
                value={formData.stok}
                onChange={(e) => handleInputChange('stok', e.target.value)}
                disabled={isLoading}
                min="0"
              />
              {errors.stok && (
                <p className="text-sm text-destructive">{errors.stok}</p>
              )}
            </div>

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
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Menyimpan...' : (product ? 'Update' : 'Simpan')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
