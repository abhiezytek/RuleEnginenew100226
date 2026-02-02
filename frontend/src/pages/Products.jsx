import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { ProductBadge } from '../components/shared/StatusBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { PageLoader } from '../components/shared/LoadingSpinner';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/api';
import { PRODUCT_TYPES } from '../lib/constants';
import { toast } from 'sonner';
import { 
  Plus, 
  Package, 
  Edit, 
  Trash2, 
  Save
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    product_type: 'term_life',
    description: '',
    min_age: 18,
    max_age: 65,
    min_sum_assured: 100000,
    max_sum_assured: 10000000,
    min_premium: 1000,
    is_enabled: true
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateDialog = () => {
    setSelectedProduct(null);
    setFormData({
      code: '',
      name: '',
      product_type: 'term_life',
      description: '',
      min_age: 18,
      max_age: 65,
      min_sum_assured: 100000,
      max_sum_assured: 10000000,
      min_premium: 1000,
      is_enabled: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setSelectedProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      product_type: product.product_type,
      description: product.description || '',
      min_age: product.min_age,
      max_age: product.max_age,
      min_sum_assured: product.min_sum_assured,
      max_sum_assured: product.max_sum_assured,
      min_premium: product.min_premium,
      is_enabled: product.is_enabled
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Code and Name are required');
      return;
    }

    try {
      setSaving(true);
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, formData);
        toast.success('Product updated');
      } else {
        await createProduct(formData);
        toast.success('Product created');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      toast.success('Product deleted');
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Header title="Products" subtitle="Manage insurance products" />
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="products-page">
      <Header title="Products" subtitle="Manage insurance products and their configurations" />
      
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog} data-testid="create-product-btn">
            <Plus className="w-4 h-4 mr-2" />
            Create Product
          </Button>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Create insurance products to associate with underwriting rules."
            actionLabel="Create Product"
            onAction={openCreateDialog}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="border-slate-200 hover:shadow-md transition-shadow"
                data-testid={`product-card-${product.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-slate-500 font-mono mt-1">{product.code}</p>
                    </div>
                    <ProductBadge product={product.product_type} />
                  </div>
                </CardHeader>
                <CardContent>
                  {product.description && (
                    <p className="text-sm text-slate-600 mb-4">{product.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Age Range</span>
                      <span className="font-medium">{product.min_age} - {product.max_age} years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sum Assured</span>
                      <span className="font-medium">{formatCurrency(product.min_sum_assured)} - {formatCurrency(product.max_sum_assured)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Min Premium</span>
                      <span className="font-medium">{formatCurrency(product.min_premium)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-medium ${product.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {product.is_enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openEditDialog(product)}
                      data-testid={`edit-product-${product.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedProduct(product);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-product-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? 'Edit Product' : 'Create Product'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., TERM001"
                    className="mt-1.5"
                    data-testid="product-code-input"
                  />
                </div>
                <div>
                  <Label>Product Type</Label>
                  <Select 
                    value={formData.product_type} 
                    onValueChange={(v) => setFormData({ ...formData, product_type: v })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="product-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Term Life Protect"
                    className="mt-1.5"
                    data-testid="product-name-input"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description"
                    className="mt-1.5"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <Label>Min Age</Label>
                  <Input
                    type="number"
                    value={formData.min_age}
                    onChange={(e) => setFormData({ ...formData, min_age: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Max Age</Label>
                  <Input
                    type="number"
                    value={formData.max_age}
                    onChange={(e) => setFormData({ ...formData, max_age: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Min Sum Assured (₹)</Label>
                  <Input
                    type="number"
                    value={formData.min_sum_assured}
                    onChange={(e) => setFormData({ ...formData, min_sum_assured: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Max Sum Assured (₹)</Label>
                  <Input
                    type="number"
                    value={formData.max_sum_assured}
                    onChange={(e) => setFormData({ ...formData, max_sum_assured: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Min Premium (₹)</Label>
                  <Input
                    type="number"
                    value={formData.min_premium}
                    onChange={(e) => setFormData({ ...formData, min_premium: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                  />
                  <Label>Enabled</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} data-testid="save-product-btn">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Products;
