'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  offerPrice: number | null;
  stock: number;
  description: string;
  benefits: string;
  ingredients: string;
  specifications: string;
  imageUrls: string; // JSON parsed
  productUrl: string;
  cataloguePdfUrl: string;
  imageUrl?: string | null;
  catalogueUrl?: string | null;
  videoUrl?: string | null;
  websiteUrl?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [cataloguePdfUrl, setCataloguePdfUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatalogue, setUploadingCatalogue] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Chat Preview state
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to download product list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setBarcode('');
    setCategory('');
    setBrand('');
    setUnit('packets');
    setPrice('');
    setOfferPrice('');
    setStock('100');
    setDescription('');
    setBenefits('');
    setIngredients('');
    setSpecifications('');
    setImageUrl('');
    setProductUrl('');
    setCataloguePdfUrl('');
    setVideoUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku || '');
    setBarcode(p.barcode || '');
    setCategory(p.category || '');
    setBrand(p.brand || '');
    setUnit(p.unit || 'pcs');
    setPrice(String(p.price));
    setOfferPrice(p.offerPrice ? String(p.offerPrice) : '');
    setStock(String(p.stock));
    setDescription(p.description || '');
    setBenefits(p.benefits || '');
    setIngredients(p.ingredients || '');
    setSpecifications(p.specifications || '');
    
    let imgPaths = [];
    try { imgPaths = JSON.parse(p.imageUrls || '[]'); } catch (e) {}
    setImageUrl(p.imageUrl || imgPaths[0] || '');
    
    setProductUrl(p.websiteUrl || p.productUrl || '');
    setCataloguePdfUrl(p.catalogueUrl || p.cataloguePdfUrl || '');
    setVideoUrl(p.videoUrl || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setSuccess('Product removed successfully.');
      fetchProducts();
      if (previewProduct?.id === productId) setPreviewProduct(null);
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !price) {
      setError('Product name and base price are required.');
      return;
    }

    const payload = {
      name,
      sku,
      barcode,
      category,
      brand,
      unit,
      price: parseFloat(price),
      offerPrice: offerPrice ? parseFloat(offerPrice) : null,
      stock: parseInt(stock),
      description,
      benefits,
      ingredients,
      specifications,
      imageUrls: JSON.stringify(imageUrl ? [imageUrl] : []),
      productUrl,
      cataloguePdfUrl,
      imageUrl,
      catalogueUrl: cataloguePdfUrl,
      videoUrl,
      websiteUrl: productUrl
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        setSuccess('Product updated successfully.');
      } else {
        await api.post('/products', payload);
        setSuccess('Product registered successfully.');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preserve product record.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setImageUrl(res.data.url);
        setSuccess('Product image uploaded successfully to Cloudinary.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload product image to Cloudinary.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCatalogueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCatalogue(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('catalogue', file);

      const res = await api.post('/products/upload-catalogue', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setCataloguePdfUrl(res.data.url);
        setSuccess('Product catalogue PDF uploaded successfully to Cloudinary.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload product catalogue to Cloudinary.');
    } finally {
      setUploadingCatalogue(false);
    }
  };

  // Get distinct categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Product Catalog <Package className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-sm text-neutral-400">Manage items, stock thresholds, pricing, and AI recommendation structures.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {success && (
        <div className="p-4 rounded-lg bg-green-950/20 border border-green-800/50 text-green-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, SKU, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-250 placeholder-neutral-500"
          />
        </div>
        
        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto justify-start md:justify-end">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-200 border ${
                activeCategory === cat
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-450 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main split grid: Product catalog on left, WhatsApp Card Preview on right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Section: Product lists (col-span 2) */}
        <div className="xl:col-span-2 space-y-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center border border-neutral-800 bg-neutral-900/10 rounded-2xl">
              <Package className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-xs text-neutral-500">No products resolved matching filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map(p => {
                const discount = p.offerPrice ? Math.round(((p.price - p.offerPrice) / p.price) * 100) : 0;
                let imgArr = [];
                try { imgArr = JSON.parse(p.imageUrls || '[]'); } catch (e) {}
                const mainImage = imgArr[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'; // fallback
                
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/10 hover:border-neutral-750 transition-all flex flex-col justify-between space-y-4 group overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Product Header details */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase bg-neutral-950 border border-neutral-800 text-neutral-400">
                            {p.category || 'General'}
                          </span>
                          <h3 className="font-bold text-sm text-neutral-100 mt-1.5 leading-snug truncate" title={p.name}>
                            {p.name}
                          </h3>
                          <span className="block text-[10px] text-neutral-500 font-mono mt-0.5">SKU: {p.sku || 'N/A'}</span>
                        </div>
                        
                        <div className="text-right shrink-0">
                          {p.offerPrice ? (
                            <>
                              <span className="text-xs text-neutral-500 line-through block">₹{parseFloat(p.price as any).toFixed(2)}</span>
                              <span className="text-sm font-extrabold text-green-400">₹{parseFloat(p.offerPrice as any).toFixed(2)}</span>
                              <span className="block text-[8px] font-bold text-green-400 uppercase bg-green-500/10 border border-green-500/20 px-1 py-0.5 rounded mt-1">-{discount}% Off</span>
                            </>
                          ) : (
                            <span className="text-sm font-extrabold text-neutral-200">₹{parseFloat(p.price as any).toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      {/* Stock Check status */}
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-neutral-800/40">
                        <span className="text-neutral-500">Stock Available:</span>
                        <span className={`font-bold ${p.stock < 20 ? 'text-red-400 animate-pulse' : 'text-neutral-300'}`}>
                          {p.stock} {p.unit}
                        </span>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs text-neutral-450 leading-relaxed line-clamp-2">
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Action Panel */}
                    <div className="pt-3 border-t border-neutral-800/40 flex justify-between gap-2">
                      <button
                        onClick={() => setPreviewProduct(p)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-semibold text-[10px] uppercase flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> AI Card Preview
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg border border-red-950 hover:bg-red-950/20 text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: WhatsApp Card template render (col-span 1) */}
        <div>
          {previewProduct ? (
            <div className="p-6 rounded-2xl border border-indigo-500/25 bg-indigo-950/5 space-y-4 sticky top-6 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-bold text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider text-indigo-400">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> WhatsApp Smart Card
                </h3>
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat bubble preview representation */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-mono space-y-3 whitespace-pre-wrap text-neutral-300 leading-relaxed">
                📦 *PRODUCT CARD: {previewProduct.name.toUpperCase()}*
                {"\n"}-------------------------------
                {"\n"}💰 Price: ₹{parseFloat((previewProduct.offerPrice || previewProduct.price) as any).toFixed(2)}
                {"\n"}✨ Benefits: {previewProduct.benefits || '100% Organic, Natural & Healthy'}
                {"\n"}🧪 Ingredients: {previewProduct.ingredients || 'Natural organic extracts'}
                {"\n"}📦 Stock Status: {previewProduct.stock > 0 ? `${previewProduct.stock} ${previewProduct.unit} available` : 'Out of stock'}
                {"\n"}📝 Description: {previewProduct.description || 'Premium quality selection.'}
                {previewProduct.specifications && `\n🔬 Specs: ${previewProduct.specifications}`}
                {"\n"}-------------------------------
                {"\n"}💡 *AI Recommendation:* Based on this interest, we recommend: *Beetroot Malt, Nendran Banana Malt*.
                {previewProduct.productUrl && `\n🔗 Order Link: ${previewProduct.productUrl}`}
                {previewProduct.cataloguePdfUrl && `\n📄 Catalog: ${previewProduct.cataloguePdfUrl}`}
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-850/50 rounded-xl text-[10px] text-neutral-450 leading-relaxed">
                <strong>Heuristic Lookup Demo:</strong> When a customer mentions <em>"{previewProduct.name.toLowerCase()}"</em> or its SKU in WhatsApp, the assistant automatically retrieves these metrics, suggest Beetroot Malt/Banana Malt, and drafts a reply.
              </div>
            </div>
          ) : (
            <div className="p-12 border border-dashed border-neutral-800 bg-neutral-950/10 rounded-2xl text-center text-neutral-500 sticky top-6">
              <Sparkles className="w-8 h-8 text-neutral-700 mx-auto mb-3 animate-pulse" />
              <h4 className="font-bold text-xs text-neutral-450">WhatsApp AI Card Preview</h4>
              <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px] mx-auto">Click "AI Card Preview" on any catalog item on the left to see the structured dispatch layout.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal Dialog for Adding / Updating product details */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-neutral-100">
                {editingProduct ? 'Edit Catalog Product details' : 'Register New Catalog Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beetroot Malt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">SKU Code identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. BT-MALT-100"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Health Drinks"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Amudhasurabiy"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Unit size</label>
                  <input
                    type="text"
                    placeholder="e.g. packets / boxes"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Stock Level</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Base Price (₹) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 220"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Offer Price (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. 195"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Barcode</label>
                  <input
                    type="text"
                    placeholder="EAN/UPC identifier"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Benefits</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Boosts hemoglobin..."
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Ingredients</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Sprouted ragi, Cashews..."
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Specifications</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Shelf Life: 6 Months..."
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Product Image (Cloudinary)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload below..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-255"
                    />
                    <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-850 bg-neutral-900/60 text-[10px] font-bold uppercase tracking-wider text-neutral-450 hover:text-neutral-250 hover:bg-neutral-800 cursor-pointer transition-all">
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Web Product Link</label>
                  <input
                    type="text"
                    placeholder="e.g. http://site.com/item"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Catalog PDF (Cloudinary)</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="PDF URL or upload below..."
                      value={cataloguePdfUrl}
                      onChange={(e) => setCataloguePdfUrl(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-255"
                    />
                    <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-850 bg-neutral-900/60 text-[10px] font-bold uppercase tracking-wider text-neutral-455 hover:text-neutral-255 hover:bg-neutral-800 cursor-pointer transition-all">
                      {uploadingCatalogue ? 'Uploading...' : 'Upload PDF'}
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleCatalogueUpload}
                        disabled={uploadingCatalogue}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Video URL (Cloudinary)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://res.cloudinary.com/.../video.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 cursor-pointer shrink-0"
              >
                {editingProduct ? 'Save Changes' : 'Register Product'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
