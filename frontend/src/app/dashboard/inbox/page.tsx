'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import {
  Search,
  UserCheck,
  Tag,
  Clipboard,
  FileText,
  User,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Send,
  PlusCircle,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  Smile,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Pin,
  Archive,
  Star,
  Plus,
  ShoppingBag,
  FileUp,
  X
} from 'lucide-react';

const QUICK_REPLIES = [
  { label: '👋 Greeting', text: 'Hello! Thank you for contacting Amudhasurabiy Organics. How can we help you today?' },
  { label: '📦 Product Inquiry', text: 'We offer a wide range of 100% natural, organic products. Which specific item are you interested in?' },
  { label: '💳 Payment Options', text: 'You can pay securely via UPI, NetBanking, or Cash on Delivery (COD). Let us know your preferred method!' },
  { label: '🚚 Delivery Time', text: 'Orders are typically processed within 24 hours and delivered within 3-5 business days.' },
  { label: '🙏 Thank You', text: 'Thank you for your order! We appreciate your support for organic farming.' }
];

interface Chat {
  id: string;
  chatId: string;
  name: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  assignedTo: string | null;
  salesStatus: 'All' | 'Unread' | 'Leads' | 'Orders' | 'Follow-up' | 'Support' | 'General';
  customerStatus: string;
  Assignee?: { id: string; name: string };
  isPinned: boolean;
  isArchived: boolean;
  phoneNumber?: string | null;
  profilePicUrl?: string | null;
  isGroup: boolean;
}

interface DetectedProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  unit: string;
  description?: string;
  benefits?: string;
  ingredients?: string;
  specifications?: string;
  imageUrl?: string;
  catalogueUrl?: string;
  websiteUrl?: string;
  recommendations?: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  }>;
}

interface Message {
  id: string;
  chatId: string;
  messageId: string;
  body: string;
  timestamp: string;
  fromMe: boolean;
  type: string;
  leadIntent: string;
  orderIntent: string;
  sentiment: string;
  suggestedReply: string | null;
  isStarred: boolean;
  detectedProduct?: DetectedProduct;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
}

interface Note {
  id: string;
  note: string;
  createdAt: string;
  User?: { name: string };
}

interface Order {
  id: string;
  totalValue: number;
  status: string;
  createdAt: string;
  items: string; // JSON parsed
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  offerPrice: number | null;
  unit: string;
  stock: number;
}

export default function TeamInboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  // Real WhatsApp Inbox syncing state
  const [selectedChatType, setSelectedChatType] = useState<'personal' | 'groups'>('personal');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Disconnected');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Leads' | 'Orders' | 'Follow-up' | 'Support' | 'Archived'>('All');

  const handleSyncChats = async () => {
    try {
      setSyncing(true);
      setAlertError('');
      setAlertSuccess('');
      const res = await api.post('/whatsapp/sync-chats');
      if (res.data.success) {
        setAlertSuccess('WhatsApp chat sync triggered in background! Mirrors will update shortly.');
      }
    } catch (err: any) {
      setSyncing(false);
      setAlertError(err.response?.data?.error || 'Failed to trigger chat sync.');
    }
  };

  // Input states
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showNotesTab, setShowNotesTab] = useState(false);

  // CRM Profile Edit States
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [crmProfile, setCrmProfile] = useState<any>(null);

  // Modals for actions
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  
  // Custom action parameters
  const [orderProductId, setOrderProductId] = useState('');
  const [orderQty, setOrderQty] = useState('1');
  const [followTitle, setFollowTitle] = useState('');
  const [followDate, setFollowDate] = useState('');

  // Alert systems
  const [alertError, setAlertError] = useState('');
  const [alertSuccess, setAlertSuccess] = useState('');

  // Attachment states
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [attachedType, setAttachedType] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAttachedFile(file);
    setUploadingAttachment(true);
    setAlertError('');
    setAlertSuccess('');

    try {
      const formData = new FormData();
      let endpoint = '';
      if (file.type.startsWith('image/')) {
        formData.append('image', file);
        endpoint = '/products/upload-image';
      } else if (file.type === 'application/pdf') {
        formData.append('catalogue', file);
        endpoint = '/products/upload-catalogue';
      } else {
        throw new Error('Unsupported format. Support image files and PDF documents.');
      }

      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setAttachedUrl(res.data.url);
        setAttachedType(file.type);
        setAlertSuccess(`File "${file.name}" uploaded successfully!`);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setAlertError(err.message || err.response?.data?.error || 'Failed to upload attachment.');
      setAttachedFile(null);
      setAttachedUrl(null);
      setAttachedType(null);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const showArchived = activeFilter === 'Archived';
      const [chatsRes, teamRes, prodRes, statusRes] = await Promise.all([
        api.get(`/whatsapp/chats?archived=${showArchived}`),
        api.get('/auth/users'),
        api.get('/products'),
        api.get('/whatsapp/status').catch(() => null)
      ]);
      setChats(chatsRes.data);
      setTeamMembers(teamRes.data || []);
      setProducts(prodRes.data || []);
      if (statusRes && statusRes.data) {
        setSyncStatus(statusRes.data.status);
        if (statusRes.data.status.startsWith('Syncing')) {
          setSyncing(true);
        } else if (statusRes.data.status === 'Live' || statusRes.data.status === 'Synced') {
          setSyncing(false);
        }
      }
    } catch (err) {
      console.error('Failed to load initial inbox data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    if (!user) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') 
        ? window.location.origin 
        : 'http://localhost:5000');
    const socket: Socket = io(socketUrl, {
      query: { workspaceId: user.workspaceId }
    });

    socket.on('status_change', (data: { status: string }) => {
      setSyncStatus(data.status);
      if (data.status.startsWith('Syncing')) {
        setSyncing(true);
      } else if (data.status === 'Live' || data.status === 'Synced') {
        setSyncing(false);
        fetchData();
      }
    });

    socket.on('new_chat_message', (data: { chat: Chat; message: Message }) => {
      // Update chat last message and unread count in state
      setChats(prev => {
        const index = prev.findIndex(c => c.chatId === data.chat.chatId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            lastMessage: data.chat.lastMessage,
            lastMessageTime: data.chat.lastMessageTime,
            unreadCount: data.chat.unreadCount
          };
          return updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
          });
        } else {
          return [data.chat, ...prev];
        }
      });

      // Append message if it's the currently selected chat
      setSelectedChat(currentSelected => {
        if (currentSelected && currentSelected.chatId === data.message.chatId) {
          setMessages(prevMsgs => [...prevMsgs, data.message]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        return currentSelected;
      });
    });

    socket.on('order_detected', (data: { chatId: string; orderData: any }) => {
      setSelectedChat(currentSelected => {
        if (currentSelected && currentSelected.chatId === data.chatId) {
          setAlertSuccess(`AI Sales Assistant automatically extracted a new Order Draft: ${data.orderData.quantity}x ${data.orderData.productName}!`);
          loadChatOrders(data.chatId);
        }
        return currentSelected;
      });
    });

    socket.on('chats_synced', (data: { count: number }) => {
      setAlertSuccess(`Successfully synced ${data.count} chats from connected WhatsApp account!`);
      setSyncing(false);
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user, activeFilter]);

  // Apply Chat Filtering & Searching
  useEffect(() => {
    let result = chats;

    // Filter by type (personal vs groups)
    if (selectedChatType === 'personal') {
      result = result.filter(c => !c.isGroup);
    } else if (selectedChatType === 'groups') {
      result = result.filter(c => c.isGroup);
    }

    // Filters
    if (activeFilter === 'Unread') {
      result = result.filter(c => c.unreadCount > 0);
    } else if (activeFilter === 'Leads') {
      result = result.filter(c => c.salesStatus === 'Leads');
    } else if (activeFilter === 'Orders') {
      result = result.filter(c => c.salesStatus === 'Orders');
    } else if (activeFilter === 'Follow-up') {
      result = result.filter(c => c.salesStatus === 'Follow-up');
    } else if (activeFilter === 'Support') {
      result = result.filter(c => c.salesStatus === 'Support');
    }

    // Search query
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.chatId.includes(q));
    }

    setFilteredChats(result);
  }, [chats, activeFilter, searchTerm, selectedChatType]);

  // Load chat details
  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    setAlertError('');
    setAlertSuccess('');
    try {
      // Clear unread counts locally
      setChats(prev => {
        const index = prev.findIndex(c => c.id === chat.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index].unreadCount = 0;
          return updated;
        }
        return prev;
      });

      const [msgRes, notesRes] = await Promise.all([
        api.get(`/whatsapp/chats/${chat.chatId}/messages`),
        api.get(`/whatsapp/chats/${chat.chatId}/notes`)
      ]);
      setMessages(msgRes.data);
      setNotes(notesRes.data);
      loadChatOrders(chat.chatId);

      // Load CRM Contact Details
      const cleanPhone = chat.chatId.split('@')[0];
      const contactRes = await api.get(`/contacts/search?phone=${cleanPhone}`).catch(() => null);
      if (contactRes && contactRes.data) {
        setCrmProfile(contactRes.data);
        setCustomerName(contactRes.data.name || '');
        setCustomerCity(contactRes.data.city || '');
      } else {
        setCrmProfile(null);
        setCustomerName(chat.name || '');
        setCustomerCity('');
      }

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    } catch (err) {
      console.error('Failed to load chat details:', err);
    }
  };

  const loadChatOrders = async (chatId: string) => {
    try {
      const ordersRes = await api.get(`/orders`);
      const chatOrders = ordersRes.data.filter((o: any) => o.chatId === chatId);
      setOrders(chatOrders);
    } catch (e) {}
  };

  // Dispatch message reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat) return;
    if (!replyText.trim() && !attachedUrl) return;

    try {
      const payload: any = {
        phone: selectedChat.chatId,
        message: replyText
      };
      if (attachedUrl) {
        payload.fileUrl = attachedUrl;
        payload.fileType = attachedType;
      }

      const res = await api.post('/whatsapp/send', payload);
      if (res.data.success) {
        setReplyText('');
        setAttachedFile(null);
        setAttachedUrl(null);
        setAttachedType(null);
      }
    } catch (err: any) {
      setAlertError(err.response?.data?.error || 'Failed to dispatch reply.');
    }
  };

  // Send internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !noteText.trim()) return;

    try {
      const res = await api.post('/whatsapp/chats/notes', {
        chatId: selectedChat.chatId,
        note: noteText
      });
      if (res.data.success) {
        setNotes(prev => [res.data.note, ...prev]);
        setNoteText('');
      }
    } catch (err) {
      setAlertError('Failed to add internal note.');
    }
  };

  // Star / Unstar Message
  const handleToggleStar = async (messageId: string) => {
    try {
      await api.put(`/whatsapp/messages/${messageId}/star`);
      setMessages(prev =>
        prev.map(m => (m.messageId === messageId ? { ...m, isStarred: !m.isStarred } : m))
      );
    } catch (err) {
      setAlertError('Failed to star message.');
    }
  };

  // Flag AI Auto-Reply
  const handleFlagMessage = async (messageId: string) => {
    const reason = prompt("Why was this AI auto-reply wrong? (e.g. incorrect price, inappropriate tone):", "Incorrect price details");
    if (reason === null) return;
    try {
      await api.post(`/whatsapp/messages/${messageId}/flag`, { reason });
      setAlertSuccess("Auto-reply successfully flagged for prompt tuning.");
    } catch (err: any) {
      setAlertError(err.response?.data?.error || "This message cannot be flagged or was not sent by the AI.");
    }
  };

  // Pin / Unpin Chat
  const handleTogglePin = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await api.put(`/whatsapp/chats/${chatId}/pin`);
      setChats(prev =>
        prev.map(c => (c.chatId === chatId ? { ...c, isPinned: !c.isPinned } : c)).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        })
      );
    } catch (err) {
      setAlertError('Failed to pin chat.');
    }
  };

  // Archive / Unarchive Chat
  const handleToggleArchive = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await api.put(`/whatsapp/chats/${chatId}/archive`);
      setChats(prev => prev.filter(c => c.chatId !== chatId));
      if (selectedChat?.chatId === chatId) setSelectedChat(null);
      setAlertSuccess('Chat archived/unarchived successfully.');
    } catch (err) {
      setAlertError('Failed to archive chat.');
    }
  };

  // 1-Click Smart Actions
  const handleCreateLead = async () => {
    if (!selectedChat) return;
    const cleanPhone = selectedChat.chatId.split('@')[0];
    try {
      if (crmProfile && crmProfile.id) {
        await api.put(`/contacts/${crmProfile.id}`, {
          leadStage: 'New',
          leadScore: 'Warm'
        });
      } else {
        await api.post('/contacts', {
          name: customerName,
          phone: cleanPhone,
          city: customerCity,
          leadStage: 'New',
          leadScore: 'Warm',
          tags: 'Lead'
        });
      }
      setAlertSuccess('Contact successfully updated to New Lead pipeline stage!');
      handleChatSelect(selectedChat);
    } catch (err) {
      setAlertError('Failed to classify as Lead.');
    }
  };

  const handleCreateCustomer = async () => {
    if (!selectedChat) return;
    const cleanPhone = selectedChat.chatId.split('@')[0];
    try {
      if (crmProfile && crmProfile.id) {
        await api.put(`/contacts/${crmProfile.id}`, {
          tags: crmProfile.tags ? `${crmProfile.tags},VIP` : 'VIP'
        });
      } else {
        await api.post('/contacts', {
          name: customerName,
          phone: cleanPhone,
          city: customerCity,
          tags: 'VIP'
        });
      }
      setAlertSuccess('Contact successfully tagged as VIP Customer!');
      handleChatSelect(selectedChat);
    } catch (err) {
      setAlertError('Failed to tag as Customer.');
    }
  };

  const handleSendCatalogue = async () => {
    if (!selectedChat) return;
    try {
      await api.post('/whatsapp/send', {
        phone: selectedChat.chatId,
        message: 'Please find our product catalogue attached below.',
        fileUrl: '/uploads/catalogue.pdf',
        fileType: 'application/pdf'
      });
      setAlertSuccess('Product Catalogue PDF dispatched in chat.');
    } catch (err) {
      setAlertError('Failed to send Catalogue PDF.');
    }
  };

  const handleSendProductCard = async (prod: CatalogProduct) => {
    if (!selectedChat) return;
    const priceVal = prod.offerPrice || prod.price;
    const msg = `📦 *PRODUCT CARD: ${prod.name.toUpperCase()}*\n` +
      `-------------------------------\n` +
      `💰 Price: ₹${parseFloat(priceVal as any).toFixed(2)}\n` +
      `📦 Stock Status: ${prod.stock > 0 ? `${prod.stock} ${prod.unit} available` : 'Out of stock'}\n` +
      `-------------------------------\n` +
      `🔗 Order Link: http://localhost:3000/products/${prod.id}`;
    
    try {
      await api.post('/whatsapp/send', {
        phone: selectedChat.chatId,
        message: msg
      });
      setAlertSuccess(`Product Card for ${prod.name} sent successfully!`);
    } catch (err) {
      setAlertError('Failed to dispatch Product Card.');
    }
  };

  const handleSendProductDetails = async (productId: string) => {
    if (!selectedChat) return;
    try {
      const res = await api.post('/whatsapp/send-product', {
        phone: selectedChat.chatId,
        productId
      });
      if (res.data.success) {
        setAlertSuccess('Product details sent successfully.');
      }
    } catch (err: any) {
      setAlertError(err.response?.data?.error || 'Failed to send product details.');
    }
  };

  const handleSendBenefits = async (name: string, benefits: string) => {
    if (!selectedChat) return;
    const msg = `🌟 *BENEFITS OF ${name.toUpperCase()}*:\n\n${benefits}`;
    try {
      const res = await api.post('/whatsapp/send', {
        phone: selectedChat.chatId,
        message: msg
      });
      if (res.data.success) {
        setAlertSuccess('Product benefits sent successfully.');
      }
    } catch (err: any) {
      setAlertError(err.response?.data?.error || 'Failed to send product benefits.');
    }
  };

  const handleSendProductCatalogue = async (pdfUrl: string) => {
    if (!selectedChat) return;
    try {
      await api.post('/whatsapp/send', {
        phone: selectedChat.chatId,
        message: 'Please find our product catalogue attached below.',
        fileUrl: pdfUrl,
        fileType: 'application/pdf'
      });
      setAlertSuccess('Product Catalogue PDF dispatched in chat.');
    } catch (err: any) {
      setAlertError(err.response?.data?.error || 'Failed to send Catalogue PDF.');
    }
  };

  const handleCreateOrderForProduct = (productId: string) => {
    setOrderProductId(productId);
    setOrderQty('1');
    setIsOrderModalOpen(true);
  };

  const handleDraftOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !orderProductId) return;

    const matchedProd = products.find(p => p.id === orderProductId);
    if (!matchedProd) return;

    const qty = parseInt(orderQty) || 1;
    const priceVal = matchedProd.offerPrice || matchedProd.price;
    const totalVal = qty * priceVal;

    try {
      await api.post('/orders', {
        chatId: selectedChat.chatId,
        customerName: selectedChat.name,
        phone: selectedChat.chatId.split('@')[0],
        city: customerCity || 'Chennai',
        totalValue: totalVal,
        items: [{
          productName: matchedProd.name,
          quantity: qty,
          price: priceVal,
          unit: matchedProd.unit
        }]
      });

      setAlertSuccess(`Draft Sales Order for ${qty}x ${matchedProd.name} created!`);
      setIsOrderModalOpen(false);
      loadChatOrders(selectedChat.chatId);
    } catch (err) {
      setAlertError('Failed to draft Sales Order.');
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !followTitle || !followDate) return;

    try {
      await api.post('/tasks', {
        title: followTitle,
        dueDate: followDate,
        contactId: crmProfile?.id || null,
        reminderType: 'WhatsApp',
        description: `WhatsApp conversation re-engagement for ${selectedChat.name}.`
      });

      setAlertSuccess(`WhatsApp Follow Up reminder scheduled for ${new Date(followDate).toLocaleDateString()}!`);
      setIsFollowUpModalOpen(false);
      setFollowTitle('');
      setFollowDate('');
    } catch (err) {
      setAlertError('Failed to schedule Follow Up task.');
    }
  };

  // Change Assignee
  const handleAssignChange = async (userId: string) => {
    if (!selectedChat) return;
    try {
      const res = await api.post('/whatsapp/chats/assign', {
        chatId: selectedChat.chatId,
        userId: userId || null
      });
      if (res.data.success) {
        setSelectedChat(prev => prev ? { ...prev, assignedTo: userId || null } : null);
        fetchData();
        setAlertSuccess('Chat thread assigned successfully.');
      }
    } catch (err) {
      setAlertError('Failed to update assignee.');
    }
  };

  // Change Sales Status
  const handleSalesStatusChange = async (status: string) => {
    if (!selectedChat) return;
    try {
      const res = await api.post('/whatsapp/chats/sales-status', {
        chatId: selectedChat.chatId,
        salesStatus: status
      });
      if (res.data.success) {
        setSelectedChat(prev => prev ? { ...prev, salesStatus: status as any } : null);
        fetchData();
        setAlertSuccess('Chat status updated successfully.');
      }
    } catch (err) {
      setAlertError('Failed to update chat sales status.');
    }
  };

  // CRM profile saving
  const handleSaveCRM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat) return;
    const cleanPhone = selectedChat.chatId.split('@')[0];

    try {
      if (crmProfile && crmProfile.id) {
        await api.put(`/contacts/${crmProfile.id}`, {
          name: customerName,
          city: customerCity
        });
      } else {
        const res = await api.post('/contacts', {
          name: customerName,
          phone: cleanPhone,
          city: customerCity,
          tags: 'Customer,WhatsApp'
        });
        setCrmProfile(res.data);
      }
      setAlertSuccess('Customer CRM profile updated successfully.');
      setChats(prev => prev.map(c => c.chatId === selectedChat.chatId ? { ...c, name: customerName } : c));
      setSelectedChat(prev => prev ? { ...prev, name: customerName } : null);
    } catch (err) {
      setAlertError('Failed to save CRM contact details.');
    }
  };

  // Draft approval
  const handleApproveDraft = async (orderId: string) => {
    try {
      const res = await api.post(`/orders/${orderId}/approve`);
      if (res.data.success) {
        setAlertSuccess('AI Draft order approved! Lifetime values synced.');
        if (selectedChat) {
          loadChatOrders(selectedChat.chatId);
          const cleanPhone = selectedChat.chatId.split('@')[0];
          const contactRes = await api.get(`/contacts/search?phone=${cleanPhone}`);
          if (contactRes.data) {
            setCrmProfile(contactRes.data);
          }
        }
      }
    } catch (err) {
      setAlertError('Failed to approve draft order.');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-2xl border border-neutral-800 bg-neutral-900/10 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* 1. Left Pane: Chats list & filters */}
      <div className="w-80 lg:w-96 border-r border-neutral-800 flex flex-col h-full bg-neutral-955/20 shrink-0">
        
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              Conversations
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                syncStatus === 'Live' || syncStatus === 'Synced'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : syncStatus.startsWith('Syncing') || syncStatus.startsWith('Restoring') || syncStatus === 'Connecting' || syncStatus === 'Authenticating' || syncStatus === 'Session expired, generating new QR'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {syncStatus}
              </span>
            </h3>
            <button
              onClick={handleSyncChats}
              disabled={syncing}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all active:scale-95 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 ${
                syncing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {syncing ? 'Syncing...' : 'Sync Chats'}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search chats or phone numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-neutral-950 border border-neutral-800/80 focus:outline-none focus:border-primary/80 text-neutral-200 placeholder-neutral-500"
            />
          </div>
        </div>

        {/* Chat Type Segment: Personal vs Groups */}
        <div className="px-4 py-2 border-b border-neutral-800/50 flex gap-2 bg-neutral-950/10">
          <button
            onClick={() => setSelectedChatType('personal')}
            className={`flex-1 py-1.5 text-center rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition-all ${
              selectedChatType === 'personal'
                ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Personal ({chats.filter(c => !c.isGroup).length})
          </button>
          <button
            onClick={() => setSelectedChatType('groups')}
            className={`flex-1 py-1.5 text-center rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition-all ${
              selectedChatType === 'groups'
                ? 'bg-neutral-800 border-neutral-700 text-neutral-100'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Groups ({chats.filter(c => c.isGroup).length})
          </button>
        </div>

        {/* Filters Quick-Tab Chips */}
        <div className="px-4 py-3 border-b border-neutral-800/50 flex flex-wrap gap-1.5 bg-neutral-950/10">
          {(['All', 'Unread', 'Leads', 'Orders', 'Follow-up', 'Support', 'Archived'] as const).map(filter => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all border ${
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-neutral-955 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Chats list */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-900/40">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare className="w-8 h-8 text-neutral-700 mb-2" />
              <p className="text-xs text-neutral-500">No chat threads found</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const isSelected = selectedChat?.id === chat.id;
              const cleanPhone = chat.chatId.split('@')[0];
              const initials = chat.name 
                ? chat.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                : cleanPhone.slice(-2);
              
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-4 cursor-pointer transition-all duration-200 flex items-center justify-between border-l-2 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-primary/5 border-primary bg-gradient-to-r from-primary/5 to-transparent'
                      : 'border-transparent hover:bg-neutral-900/30'
                  }`}
                >
                  <div className="flex items-center min-w-0 flex-1 pr-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mr-3 border transition-all overflow-hidden ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/20 text-primary' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}>
                      {chat.profilePicUrl ? (
                        <>
                          <img 
                            src={chat.profilePicUrl} 
                            alt={chat.name || cleanPhone} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.avatar-fallback');
                                if (fallback) fallback.classList.remove('hidden');
                              }
                            }}
                          />
                          <span className="avatar-fallback hidden">{initials}</span>
                        </>
                      ) : (
                        initials
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs truncate block ${
                          isSelected ? 'font-bold text-neutral-100' : 'font-semibold text-neutral-250'
                        }`}>
                          {chat.name || `+${cleanPhone}`}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-medium shrink-0">
                          {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      
                      <p className={`text-[11px] truncate mt-1 ${chat.unreadCount > 0 ? 'text-neutral-100 font-medium' : 'text-neutral-450'}`}>
                        {chat.lastMessage || 'No messages'}
                      </p>
                      
                      {/* Tags & Actions */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {chat.salesStatus && chat.salesStatus !== 'General' && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                            {chat.salesStatus}
                          </span>
                        )}
                        {chat.Assignee && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-neutral-900 border border-neutral-800 text-neutral-450 flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5 text-neutral-500" /> {chat.Assignee.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pin & Archive controls */}
                  <div className="flex flex-col gap-2 items-end shrink-0 pl-1">
                    {chat.unreadCount > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center font-bold text-[9px] text-primary-foreground">
                        {chat.unreadCount}
                      </span>
                    ) : (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleTogglePin(e, chat.chatId)}
                          className={`p-1 rounded hover:bg-neutral-800 text-neutral-500 ${chat.isPinned ? 'text-amber-500' : ''}`}
                          title={chat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleToggleArchive(e, chat.chatId)}
                          className={`p-1 rounded hover:bg-neutral-800 text-neutral-500 ${chat.isArchived ? 'text-blue-400' : ''}`}
                          title={chat.isArchived ? 'Unarchive' : 'Archive'}
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {chat.isPinned && <Pin className="w-3 h-3 text-amber-500 absolute top-2 right-2 rotate-45" />}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* 2. Middle Pane: Conversational streams */}
      <div className="flex-1 flex flex-col h-full bg-neutral-950/10 min-w-0">
        {selectedChat ? (
          <>
            {/* Active Thread Header */}
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/30 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-neutral-200 truncate flex items-center gap-2">
                  {selectedChat.name}
                  {selectedChat.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />}
                </h4>
                <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">+{selectedChat.chatId.split('@')[0]}</p>
              </div>

              {/* Status and Assignee Selectors */}
              <div className="flex items-center gap-3">
                {/* Local Message Search */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className="text-[10px] pl-7 pr-7 py-1 rounded-lg bg-neutral-955 border border-neutral-850 text-neutral-300 font-bold focus:outline-none w-28 focus:w-40 transition-all duration-300"
                  />
                  {messageSearchTerm && (
                    <button
                      onClick={() => setMessageSearchTerm('')}
                      className="absolute right-2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <Tag className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={selectedChat.salesStatus}
                  onChange={(e) => handleSalesStatusChange(e.target.value)}
                  className="text-[10px] py-1 pl-2 pr-6 rounded-lg bg-neutral-950 border border-neutral-850 text-neutral-355 font-bold cursor-pointer"
                >
                  <option value="General">General</option>
                  <option value="Leads">Leads</option>
                  <option value="Orders">Orders</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Support">Support</option>
                </select>

                <UserCheck className="w-3.5 h-3.5 text-neutral-500" />
                <select
                  value={selectedChat.assignedTo || ''}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  className="text-[10px] py-1 pl-2 pr-6 rounded-lg bg-neutral-950 border border-neutral-850 text-neutral-355 font-bold cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowNotesTab(!showNotesTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all duration-200 ${
                    showNotesTab ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Clipboard className="w-3.5 h-3.5" /> {showNotesTab ? 'Conversations' : 'Internal Notes'}
                </button>
              </div>
            </div>

            {/* Local Alerts */}
            {alertError && (
              <div className="p-3 bg-red-950/20 border-b border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{alertError}</span>
              </div>
            )}
            {alertSuccess && (
              <div className="p-3 bg-green-950/20 border-b border-green-800/40 text-green-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                <span>{alertSuccess}</span>
              </div>
            )}

            {/* Conversation Flow Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {showNotesTab ? (
                /* Notes Thread */
                <div className="space-y-4 max-w-2xl mx-auto">
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Add an internal team note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-200"
                    />
                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-600 transition-all flex items-center gap-1.5 shrink-0">
                      <PlusCircle className="w-4 h-4" /> Add Note
                    </button>
                  </form>

                  <div className="space-y-3 pt-2">
                    {notes.map(note => (
                      <div key={note.id} className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/20 text-xs space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-neutral-500">
                          <span className="font-bold text-neutral-300">{note.User?.name || 'Agent'}</span>
                          <span>{new Date(note.createdAt).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-neutral-400 leading-relaxed font-sans">{note.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* WhatsApp Messages Thread */
                messages.filter(msg => !msg.body || msg.body.toLowerCase().includes(messageSearchTerm.toLowerCase())).map((msg) => {
                  const hasAI = !msg.fromMe && (msg.leadIntent !== 'None' || msg.orderIntent !== 'None' || msg.sentiment !== 'None' || msg.suggestedReply || msg.detectedProduct);
                  
                  return (
                    <div key={msg.id} className="space-y-2.5">
                      <div className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} group relative`}>
                        <div className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm border relative ${
                          msg.fromMe ? 'bg-primary/25 border-primary/30 text-neutral-100 rounded-tr-none' : 'bg-neutral-900 border-neutral-800 text-neutral-200 rounded-tl-none'
                        }`}>
                          {msg.isStarred && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute -top-2.5 -right-1" />}
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                          
                          <div className="flex justify-between items-center mt-2.5 gap-3">
                            {/* Star trigger button */}
                            <button
                              onClick={() => handleToggleStar(msg.messageId)}
                              className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-amber-500 transition-all shrink-0 cursor-pointer"
                              title="Star message"
                            >
                              <Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>
                            {msg.fromMe && (
                              <button
                                onClick={() => handleFlagMessage(msg.messageId)}
                                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-450 transition-all shrink-0 cursor-pointer"
                                title="Flag AI Response as Incorrect"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className={`block text-[9px] ${msg.fromMe ? 'text-neutral-400 font-semibold flex items-center gap-1.5' : 'text-neutral-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              {msg.fromMe && (
                                <span className="inline-block scale-90 shrink-0" title={`Status: ${msg.status || 'sent'}`}>
                                  {msg.status === 'read' ? (
                                    <span className="text-blue-400 font-black">✓✓</span>
                                  ) : msg.status === 'delivered' ? (
                                    <span className="text-neutral-400 font-bold">✓✓</span>
                                  ) : msg.status === 'failed' ? (
                                    <span className="text-red-500 font-extrabold">!</span>
                                  ) : msg.status === 'pending' ? (
                                    <Clock className="w-2.5 h-2.5 text-neutral-500 animate-pulse" />
                                  ) : (
                                    <span className="text-neutral-500">✓</span>
                                  )}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Assistant Insight Box */}
                      {hasAI && (
                        <div className="pl-4 flex justify-start animate-in fade-in duration-300">
                          <div className="p-4 rounded-2xl border border-indigo-500/25 bg-gradient-to-r from-indigo-950/20 to-purple-950/20 max-w-[85%] text-xs space-y-3 shadow-md shadow-indigo-950/10">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 tracking-wider uppercase">
                              <Sparkles className="w-3.5 h-3.5" /> AI Insights
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5">
                              {msg.leadIntent && msg.leadIntent !== 'None' && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  🎯 Lead: {msg.leadIntent}
                                </span>
                              )}
                              {msg.orderIntent && msg.orderIntent !== 'None' && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-green-500/10 text-green-400 border border-green-500/20">
                                  📦 Order: {msg.orderIntent}
                                </span>
                              )}
                            </div>

                            {msg.suggestedReply && (
                              <div className="pt-2.5 border-t border-neutral-800/80 space-y-2">
                                <span className="block text-[9px] font-bold text-indigo-300 uppercase">Suggested Reply:</span>
                                <p className="text-neutral-300 bg-neutral-950/50 p-2.5 rounded-lg border border-indigo-950 text-neutral-300 font-serif leading-relaxed italic">
                                  "{msg.suggestedReply}"
                                </p>
                                <button
                                  onClick={() => setReplyText(msg.suggestedReply || '')}
                                  className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                  Use Suggestion <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {msg.detectedProduct && (
                              <div className="pt-2.5 border-t border-neutral-800/80 space-y-3">
                                <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Detected Product Intelligence
                                </div>
                                <div className="flex gap-3 bg-neutral-950/40 p-3 rounded-xl border border-neutral-850">
                                  {msg.detectedProduct.imageUrl && (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800/80 bg-neutral-900/60">
                                      <img
                                        src={msg.detectedProduct.imageUrl}
                                        alt={msg.detectedProduct.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="font-extrabold text-neutral-100 text-xs truncate">
                                        {msg.detectedProduct.name}
                                      </h5>
                                      <span className="font-black text-green-400 text-xs shrink-0">
                                        ₹{parseFloat(msg.detectedProduct.price as any).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-neutral-450 font-medium">
                                      {msg.detectedProduct.sku && (
                                        <span>SKU: <span className="font-mono text-neutral-300">{msg.detectedProduct.sku}</span></span>
                                      )}
                                      <span>Stock: <span className={msg.detectedProduct.stock > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                        {msg.detectedProduct.stock > 0 ? `${msg.detectedProduct.stock} ${msg.detectedProduct.unit || 'units'}` : 'Out of Stock'}
                                      </span></span>
                                    </div>
                                    {(() => {
                                      const specStr = msg.detectedProduct?.specifications || '';
                                      const weightMatch = specStr.match(/weight:\s*([^\n,]+)/i);
                                      const weight = weightMatch ? weightMatch[1].trim() : '';
                                      return weight ? (
                                        <div className="text-[10px] text-neutral-450">
                                          Weight: <span className="text-neutral-300 font-bold">{weight}</span>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  {msg.detectedProduct.benefits && (
                                    <div className="bg-neutral-950/20 p-2 rounded-lg border border-neutral-850/60">
                                      <span className="block font-bold text-indigo-400/80 mb-0.5 uppercase tracking-wide text-[8px]">Benefits</span>
                                      <p className="text-neutral-350 leading-relaxed line-clamp-2" title={msg.detectedProduct.benefits}>
                                        {msg.detectedProduct.benefits}
                                      </p>
                                    </div>
                                  )}
                                  {msg.detectedProduct.ingredients && (
                                    <div className="bg-neutral-950/20 p-2 rounded-lg border border-neutral-850/60">
                                      <span className="block font-bold text-indigo-400/80 mb-0.5 uppercase tracking-wide text-[8px]">Ingredients</span>
                                      <p className="text-neutral-350 leading-relaxed line-clamp-2" title={msg.detectedProduct.ingredients}>
                                        {msg.detectedProduct.ingredients}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  <button
                                    onClick={() => handleSendProductDetails(msg.detectedProduct!.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 active:scale-95 text-[9px] font-extrabold uppercase text-neutral-100 border border-indigo-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" /> Send Product
                                  </button>
                                  {msg.detectedProduct.benefits && (
                                    <button
                                      onClick={() => handleSendBenefits(msg.detectedProduct!.name, msg.detectedProduct!.benefits || '')}
                                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-[9px] font-extrabold uppercase text-neutral-355 border border-neutral-700 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3 text-indigo-400" /> Send Benefits
                                    </button>
                                  )}
                                  {msg.detectedProduct.catalogueUrl && (
                                    <button
                                      onClick={() => handleSendProductCatalogue(msg.detectedProduct!.catalogueUrl || '')}
                                      className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-[9px] font-extrabold uppercase text-neutral-355 border border-neutral-700 transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <FileText className="w-3 h-3 text-amber-500" /> Send Catalogue
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleCreateOrderForProduct(msg.detectedProduct!.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-650 hover:bg-emerald-600 active:scale-95 text-[9px] font-extrabold uppercase text-neutral-100 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" /> Create Order
                                  </button>
                                </div>

                                {msg.detectedProduct.recommendations && msg.detectedProduct.recommendations.length > 0 && (
                                  <div className="pt-2 border-t border-neutral-850/60 space-y-2">
                                    <span className="block text-[9px] font-extrabold text-purple-300 uppercase tracking-wider">Related Recommendations</span>
                                    <div className="grid grid-cols-2 gap-2">
                                      {msg.detectedProduct.recommendations.map((rec) => (
                                        <div key={rec.id} className="p-2 rounded-lg bg-neutral-950/30 border border-neutral-850 flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-2 min-w-0">
                                            {rec.imageUrl && (
                                              <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900">
                                                <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" />
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <div className="text-[10px] font-bold text-neutral-200 truncate">{rec.name}</div>
                                              <div className="text-[9px] font-extrabold text-green-400">₹{parseFloat(rec.price as any).toFixed(2)}</div>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleSendProductDetails(rec.id)}
                                            className="p-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-[8px] font-black uppercase text-indigo-300 tracking-tight cursor-pointer"
                                            title="Send Recommended Product Card"
                                          >
                                            Send
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached file preview */}
            {attachedFile && (
              <div className="px-4 py-2 bg-neutral-900/50 border-t border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-neutral-300">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                  {uploadingAttachment ? (
                    <span className="text-[10px] text-neutral-500 animate-pulse">(Uploading...)</span>
                  ) : (
                    <span className="text-[10px] text-green-500 font-semibold">(Ready to send)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(null);
                    setAttachedUrl(null);
                    setAttachedType(null);
                  }}
                  className="text-neutral-500 hover:text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Input message footer */}
            {!showNotesTab && (
              <div className="p-4 border-t border-neutral-800 shrink-0 bg-neutral-955/20 flex flex-col gap-2">
                {/* Quick Replies chips bar */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-1 shrink-0 scrollbar-thin">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase pt-1.5 shrink-0 select-none">Quick Replies:</span>
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply.label}
                      type="button"
                      onClick={() => setReplyText(reply.text)}
                      className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-850 text-[10px] text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all font-semibold whitespace-nowrap cursor-pointer"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  <label className="p-3 rounded-xl border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-250 transition-all flex items-center justify-center shrink-0 cursor-pointer" title="Attach image or PDF">
                    <FileUp className="w-4.5 h-4.5" />
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleAttachFile}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Type a WhatsApp reply message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 px-4 py-3.5 text-xs rounded-xl bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200 placeholder-neutral-500"
                  />
                  <button
                    type="submit"
                    disabled={(!replyText.trim() && !attachedUrl) || uploadingAttachment}
                    className="p-3.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 disabled:bg-neutral-950 disabled:border disabled:border-neutral-850 disabled:text-neutral-600 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send className="w-4.5 h-4.5" />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
            <MessageSquare className="w-12 h-12 mb-3 text-neutral-700" />
            <h4 className="font-bold text-sm text-neutral-400">No Chat Selected</h4>
            <p className="text-xs text-neutral-500 mt-1">Select a customer thread from the left list pane to begin sales interactions.</p>
          </div>
        )}
      </div>

      {/* 3. Right Pane: CRM Profile, Actions, & Order Drafts */}
      {selectedChat && (
        <div className="w-80 border-l border-neutral-800 flex flex-col h-full bg-neutral-955/20 overflow-y-auto p-4 space-y-6 shrink-0">
          
          {/* Customer Profile */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-primary shrink-0" /> Customer Profile
            </h4>
            
            <form onSubmit={handleSaveCRM} className="space-y-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/10">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-[10px] font-bold uppercase text-neutral-300 cursor-pointer">
                Save Profile
              </button>
            </form>
          </div>

          {/* Smart CRM Actions Panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0" /> Smart Actions Console
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCreateLead}
                className="py-2.5 px-2 rounded-xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 text-[10px] font-bold text-neutral-300 transition-all cursor-pointer flex flex-col items-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Create Lead
              </button>
              
              <button
                onClick={handleCreateCustomer}
                className="py-2.5 px-2 rounded-xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 text-[10px] font-bold text-neutral-300 transition-all cursor-pointer flex flex-col items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4 text-green-400" /> Tag VIP Customer
              </button>

              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="py-2.5 px-2 rounded-xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 text-[10px] font-bold text-neutral-300 transition-all cursor-pointer flex flex-col items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4 text-primary" /> Create Order
              </button>

              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="py-2.5 px-2 rounded-xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 text-[10px] font-bold text-neutral-300 transition-all cursor-pointer flex flex-col items-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-amber-500" /> Create Follow Up
              </button>
            </div>

            <button
              onClick={handleSendCatalogue}
              className="w-full py-2.5 rounded-xl border border-neutral-850 bg-neutral-900/20 hover:bg-neutral-900/40 text-[10px] font-bold text-neutral-350 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-neutral-500" /> Send Catalogue PDF
            </button>
          </div>

          {/* Send Product Card quick links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-primary shrink-0" /> Quick Send Product Card
            </h4>
            
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {products.map(prod => (
                <button
                  key={prod.id}
                  onClick={() => handleSendProductCard(prod)}
                  className="w-full text-left p-2.5 rounded-xl border border-neutral-850 hover:border-indigo-500/30 bg-neutral-950/20 hover:bg-indigo-950/5 text-[10px] font-semibold text-neutral-350 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate pr-2">{prod.name}</span>
                  <span className="font-extrabold text-green-400 shrink-0">₹{parseFloat((prod.offerPrice || prod.price) as any).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CRM Purchase Metrics */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" /> Purchase Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl border border-neutral-850 bg-neutral-900/10">
                <span className="block text-[9px] text-neutral-500 uppercase font-semibold">Total Revenue</span>
                <span className="text-xs font-extrabold text-neutral-200 mt-1 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 text-green-500" />
                  {crmProfile ? parseFloat(crmProfile.totalPurchaseValue || 0).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-neutral-850 bg-neutral-900/10">
                <span className="block text-[9px] text-neutral-500 uppercase font-semibold">Last Purchase</span>
                <span className="text-[10px] font-semibold text-neutral-350 mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-550" />
                  {crmProfile && crmProfile.lastPurchaseDate ? new Date(crmProfile.lastPurchaseDate).toLocaleDateString('en-IN') : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Drafts list */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary shrink-0" /> Sales Orders
            </h4>
            
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-center text-[10px] text-neutral-500 py-4">No orders detected in this thread.</p>
              ) : (
                orders.map(order => {
                  const isDraft = order.status === 'Draft' || order.status === 'New Order';
                  let itemsList = [];
                  try { itemsList = JSON.parse(order.items || '[]'); } catch(e) {}
                  
                  return (
                    <div key={order.id} className={`p-3 rounded-xl border transition-all ${
                      isDraft ? 'border-amber-500/20 bg-amber-500/5' : 'border-neutral-850 bg-neutral-950/10'
                    } text-xs space-y-3`}>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[8px] uppercase tracking-wider ${
                          isDraft ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                        }`}>
                          {order.status}
                        </span>
                        <span className="font-extrabold text-neutral-200">
                          ₹{parseFloat(order.totalValue as any || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Items Details */}
                      <div className="space-y-1 border-t border-neutral-850 pt-2 text-[10px] text-neutral-450">
                        {itemsList.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Approval Draft Action & Documents generation */}
                      {isDraft ? (
                        <button
                          onClick={() => handleApproveDraft(order.id)}
                          className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-extrabold uppercase transition-all duration-200 cursor-pointer"
                        >
                          Approve Order Draft
                        </button>
                      ) : (
                        <div className="flex gap-1.5 border-t border-neutral-850 pt-2 shrink-0">
                          <a
                            href={`http://localhost:5000/api/orders/${order.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-bold text-center text-neutral-350 hover:bg-neutral-800"
                          >
                            Invoice
                          </a>
                          <a
                            href={`http://localhost:5000/api/orders/${order.id}/delivery-slip`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-bold text-center text-neutral-350 hover:bg-neutral-800"
                          >
                            Slip
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* order builder dialog */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <h3 className="font-bold text-xs text-neutral-250 uppercase">Draft Sales Order</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleDraftOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Choose Product *</label>
                <select
                  required
                  value={orderProductId}
                  onChange={(e) => setOrderProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-300 font-semibold cursor-pointer"
                >
                  <option value="">-- Select Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₹{parseFloat((p.offerPrice || p.price) as any).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-xl hover:bg-primary/95 transition-all">
                Save Draft Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up task dialog */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
              <h3 className="font-bold text-xs text-neutral-250 uppercase">Schedule Follow Up</h3>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="text-neutral-500"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Follow Up Action *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call client for beetroot malt pricing"
                  value={followTitle}
                  onChange={(e) => setFollowTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1.5">Scheduled Due Date *</label>
                <input
                  type="date"
                  required
                  value={followDate}
                  onChange={(e) => setFollowDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-900 border border-neutral-850 focus:outline-none focus:border-primary text-neutral-350 cursor-pointer"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase rounded-xl hover:bg-primary/95 transition-all">
                Schedule Reminder
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
