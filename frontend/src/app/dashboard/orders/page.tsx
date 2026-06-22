'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import {
  ShoppingCart,
  Calendar,
  User,
  Phone,
  DollarSign,
  Trash2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  ClipboardList
} from 'lucide-react';

interface Order {
  id: string;
  chatId: string;
  customerName: string;
  phone: string;
  totalValue: number;
  status: 'New Order' | 'Pending Confirmation' | 'Confirmed' | 'Processing' | 'Dispatched' | 'Delivered';
  city: string;
  items: any[]; // Parsed
  timeline: any[]; // Parsed
  createdAt: string;
}

const COLUMNS = [
  { id: 'New Order', label: 'New Order', color: 'border-amber-500/20 text-amber-450 bg-amber-500/5' },
  { id: 'Pending Confirmation', label: 'Pending Confirmation', color: 'border-blue-500/20 text-blue-450 bg-blue-500/5' },
  { id: 'Confirmed', label: 'Confirmed', color: 'border-indigo-500/20 text-indigo-450 bg-indigo-500/5' },
  { id: 'Processing', label: 'Processing', color: 'border-purple-500/20 text-purple-450 bg-purple-500/5' },
  { id: 'Dispatched', label: 'Dispatched', color: 'border-pink-500/20 text-pink-450 bg-pink-500/5' },
  { id: 'Delivered', label: 'Delivered', color: 'border-green-500/20 text-green-450 bg-green-500/5' }
] as const;

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusTransition = async (orderId: string, nextStatus: string) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.data.success) {
        // Refresh local list
        setOrders(prev => {
          return prev.map(order => {
            if (order.id === orderId) {
              const updatedTimeline = [...order.timeline, {
                status: nextStatus,
                timestamp: new Date().toISOString(),
                user: 'Agent'
              }];
              return {
                ...order,
                status: nextStatus as any,
                timeline: updatedTimeline
              };
            }
            return order;
          });
        });
      }
    } catch (err) {
      console.error('Failed to transition order status:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const res = await api.delete(`/orders/${orderId}`);
      if (res.data.success) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const getNextStatus = (current: string): string | null => {
    const idx = COLUMNS.findIndex(c => c.id === current);
    if (idx !== -1 && idx < COLUMNS.length - 1) {
      return COLUMNS[idx + 1].id;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
          Sales Orders Kanban Board
        </h1>
        <p className="text-sm text-neutral-400">
          Track sales lifecycles, manage status timelines, and verify values aggregated into CRM.
        </p>
      </div>

      {/* Board Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
        {COLUMNS.map(column => {
          const columnOrders = orders.filter(o => o.status === column.id);
          
          return (
            <div key={column.id} className="min-w-[240px] flex flex-col gap-4 rounded-xl bg-neutral-900/10 p-4 border border-neutral-800/80">
              
              {/* Column Header */}
              <div className={`p-2.5 rounded-lg border text-xs font-bold flex justify-between items-center ${column.color}`}>
                <span>{column.label}</span>
                <span className="bg-neutral-950/40 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                  {columnOrders.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-22rem)] min-h-[200px]">
                {columnOrders.length === 0 ? (
                  <div className="text-center text-[10px] text-neutral-600 py-8 italic">
                    No orders.
                  </div>
                ) : (
                  columnOrders.map(order => {
                    const nextStatus = getNextStatus(order.status);
                    
                    return (
                      <div
                        key={order.id}
                        className="p-3.5 rounded-xl border border-neutral-850 bg-neutral-950/30 hover:border-neutral-700 transition-all text-xs space-y-3 group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-neutral-200 truncate block max-w-[140px]">
                            {order.customerName}
                          </span>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-neutral-600 hover:text-red-400 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Phone / Date */}
                        <div className="text-[10px] text-neutral-500 font-mono space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-neutral-650" />
                            <span>+{order.phone}</span>
                          </div>
                          {order.city && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-neutral-650" />
                              <span className="truncate">{order.city}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-neutral-650" />
                            <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Items summary */}
                        <div className="border-t border-neutral-900 pt-2 space-y-1">
                          {order.items.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between text-[10px] text-neutral-450">
                              <span className="truncate max-w-[110px]">{item.productName} (x{item.quantity})</span>
                              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Value & timeline button */}
                        <div className="flex justify-between items-center pt-1.5 border-t border-neutral-900">
                          <span className="font-bold text-neutral-300">
                            ₹{parseFloat(order.totalValue as any || 0).toFixed(2)}
                          </span>

                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowTimelineModal(true);
                            }}
                            className="text-[9px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                          >
                            <Clock className="w-3 h-3" /> Timeline
                          </button>
                        </div>

                        {/* Next status transition button */}
                        {nextStatus && (
                          <button
                            onClick={() => handleStatusTransition(order.id, nextStatus)}
                            className="w-full py-1.5 rounded-lg bg-neutral-900 hover:bg-primary hover:text-primary-foreground border border-neutral-800 text-[10px] font-extrabold uppercase transition-all flex items-center justify-center gap-1"
                          >
                            Advance <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Timeline Modal */}
      {showTimelineModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="w-[450px] p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-neutral-200 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" /> Order Status Timeline
              </h3>
              <button
                onClick={() => {
                  setShowTimelineModal(false);
                  setSelectedOrder(null);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-350 uppercase font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs space-y-1">
                <p className="text-neutral-400">Customer: <span className="font-bold text-neutral-200">{selectedOrder.customerName}</span></p>
                <p className="text-neutral-400">Total Value: <span className="font-bold text-neutral-200">₹{parseFloat(selectedOrder.totalValue as any).toFixed(2)}</span></p>
              </div>

              {/* Timeline Steps */}
              <div className="relative pl-6 border-l border-neutral-800 space-y-6">
                {selectedOrder.timeline.map((step: any, i: number) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-neutral-900 shadow shadow-primary/20" />
                    <div className="text-xs">
                      <span className="font-extrabold uppercase text-primary tracking-wider text-[9px] block">
                        {step.status}
                      </span>
                      <span className="text-[10px] text-neutral-500 mt-1 block">
                        Agent: <span className="font-bold text-neutral-400">{step.user}</span>
                      </span>
                      <span className="text-[10px] text-neutral-550 block mt-0.5 font-mono">
                        {new Date(step.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
