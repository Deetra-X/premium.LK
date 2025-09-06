import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Download, 
  Mail,
  Calendar,
  DollarSign,
  User,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Invoice } from '../types';
import { getInvoices, updateInvoiceStatus } from '../data/invoiceData';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { InvoiceModal } from './InvoiceModal';

export const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>('all');
  const [filterCustomerType, setFilterCustomerType] = useState<'all' | 'standard' | 'reseller'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading invoices...');
      const invoicesData = await getInvoices();
      
      // Ensure we have a valid array and each invoice has required properties
      const validInvoices = (invoicesData || []).filter(invoice => 
        invoice && 
        invoice.id && 
        invoice.invoiceNumber && 
        invoice.customerInfo &&
        typeof invoice.customerInfo === 'object'
      );
      
      setInvoices(validInvoices);
      console.log(`✅ Loaded ${validInvoices.length} valid invoices`);
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      setInvoices([]); // Set empty array on error
      alert('❌ Failed to load invoices. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (invoice.invoiceNumber || '').toLowerCase().includes(searchLower) ||
      (invoice.customerInfo?.name || '').toLowerCase().includes(searchLower) ||
      (invoice.customerInfo?.email || '').toLowerCase().includes(searchLower) ||
      (invoice.customerInfo?.customerType === 'reseller' && 
       (invoice.customerInfo?.resellerInfo?.resellerId || '').toLowerCase().includes(searchLower));
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesCustomerType = filterCustomerType === 'all' || invoice.customerInfo?.customerType === filterCustomerType;
    
    return matchesSearch && matchesStatus && matchesCustomerType;
  });

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <FileText size={16} className="text-gray-400" />;
      case 'sent':
        return <Mail size={16} className="text-blue-400" />;
      case 'paid':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'overdue':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-400" />;
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-300';
      case 'sent':
        return 'bg-blue-500/20 text-blue-300';
      case 'paid':
        return 'bg-green-500/20 text-green-300';
      case 'overdue':
        return 'bg-red-500/20 text-red-300';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300';
    }
  };

  const handleCreateInvoice = async (invoice: Invoice) => {
    try {
      console.log(`✅ Invoice ${invoice.invoiceNumber} created successfully!`);
      
      // Add the new invoice to the list and reload to get latest data
      setInvoices(prev => [invoice, ...prev]);
      
      // Show success message
      alert(`✅ Invoice ${invoice.invoiceNumber} created successfully!`);
      
      // Optionally reload to ensure consistency with database
      await loadInvoices();
    } catch (error) {
      console.error('❌ Error handling created invoice:', error);
      alert('❌ Error occurred while processing the invoice.');
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: Invoice['status']) => {
    try {
      console.log(`🔄 Updating invoice ${invoiceId} status to ${status}...`);
      
      // Optimistically update UI
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status, updatedAt: new Date() }
            : invoice
        )
      );
      
      // Update via API (invoiceId is actually the invoice number)
      await updateInvoiceStatus(invoiceId, status);
      console.log(`✅ Successfully updated invoice ${invoiceId} status`);
      
      // Reload data to ensure consistency
      await loadInvoices();
    } catch (error) {
      console.error(`❌ Error updating invoice status:`, error);
      // Revert optimistic update on error
      await loadInvoices();
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  // Calculate summary metrics
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const overdueCount = invoices.filter(inv => inv.status === 'overdue' || (inv.status !== 'paid' && new Date() > inv.dueDate)).length;
  const resellerInvoices = invoices.filter(inv => inv.customerInfo?.customerType === 'reseller').length;

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-lg">Loading invoices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
          <p className="text-gray-400 mt-2">Create and manage detailed sales invoices</p>
        </div>
        <button
          onClick={() => {
            console.log('Create Invoice button clicked'); // Add this for debugging
            setShowCreateModal(true)
          }}

          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Invoices</p>
              <p className="text-xl font-bold text-white mt-1">{totalInvoices}</p>
            </div>
            <FileText size={24} className="text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Total Amount</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign size={24} className="text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Paid Amount</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(paidAmount)}</p>
            </div>
            <CheckCircle size={24} className="text-green-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Pending</p>
              <p className="text-xl font-bold text-white mt-1">{formatCurrency(pendingAmount)}</p>
            </div>
            <Clock size={24} className="text-yellow-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Overdue</p>
              <p className="text-xl font-bold text-white mt-1">{overdueCount}</p>
            </div>
            <AlertTriangle size={24} className="text-red-400" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400">Reseller</p>
              <p className="text-xl font-bold text-white mt-1">{resellerInvoices}</p>
            </div>
            <Building size={24} className="text-purple-400" />
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, email, or reseller ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="pl-10 pr-8 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <select
              value={filterCustomerType}
              onChange={(e) => setFilterCustomerType(e.target.value as any)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[140px]"
            >
              <option value="all">All Customers</option>
              <option value="standard">Standard</option>
              <option value="reseller">Reseller</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Invoices</h2>
            <div className="text-sm text-gray-400">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-700">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            filteredInvoices.map((invoice) => {
              const isOverdue = invoice.status !== 'paid' && new Date() > invoice.dueDate;
              
              return (
                <div key={invoice.id} className="p-6 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    {/* Invoice Header */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {invoice.invoiceNumber}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status.toUpperCase()}
                          </span>
                          {isOverdue && invoice.status !== 'paid' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        {invoice.customerInfo.customerType === 'reseller' && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                            <Building size={12} />
                            Reseller
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <div>
                            <p className="text-white font-medium">{invoice.customerInfo.name}</p>
                            <p className="text-gray-400">{invoice.customerInfo.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-300">Issue: {formatDate(invoice.issueDate)}</p>
                            <p className="text-gray-400">Due: {formatDate(invoice.dueDate)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          <div>
                            <p className="text-gray-300">{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</p>
                            <p className="text-gray-400">{invoice.paymentMethod.replace('_', ' ')}</p>
                          </div>
                        </div>
                        {invoice.customerInfo.customerType === 'reseller' && invoice.customerInfo.resellerInfo && (
                          <div className="flex items-center gap-2">
                            <Building size={16} className="text-purple-400" />
                            <div>
                              <p className="text-purple-300">ID: {invoice.customerInfo.resellerInfo.resellerId}</p>
                              <p className="text-purple-400">{invoice.customerInfo.resellerInfo.discountRate}% discount</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invoice Total and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          {formatCurrency(invoice.totalAmount)}
                        </div>
                        {invoice.customerInfo.customerType === 'reseller' && invoice.discountAmount > 0 && (
                          <div className="text-sm text-gray-400">
                            <span className="line-through">{formatCurrency(invoice.subtotal)}</span>
                            <span className="text-green-400 ml-2">-{formatCurrency(invoice.discountAmount)}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-400">
                          Tax: {formatCurrency(invoice.taxAmount)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-600 rounded-lg transition-colors"
                          title="View Invoice"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => alert('Download functionality would be implemented here')}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => alert('Email functionality would be implemented here')}
                          className="p-2 text-purple-400 hover:text-purple-300 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items Preview */}
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {invoice.items.slice(0, 3).map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{item.productName}</p>
                            <p className="text-gray-400 text-sm">
                              Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                              {item.discountPercentage && (
                                <span className="text-green-400 ml-2">(-{item.discountPercentage}%)</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">
                              {formatCurrency(item.lineTotal)}
                            </p>
                            {item.originalPrice && item.originalPrice !== item.unitPrice && (
                              <p className="text-gray-400 text-sm line-through">
                                {formatCurrency(item.originalPrice * item.quantity)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {invoice.items.length > 3 && (
                        <div className="flex items-center justify-center p-3 bg-slate-600 rounded-lg">
                          <p className="text-gray-400">+{invoice.items.length - 3} more item{invoice.items.length - 3 !== 1 ? 's' : ''}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <p className="text-sm text-gray-400">
                      <span className="font-medium">Payment Terms:</span> {invoice.paymentTerms}
                    </p>
                    {invoice.notes && (
                      <p className="text-sm text-gray-400 mt-1">
                        <span className="font-medium">Notes:</span> {invoice.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => {
            console.log('Closing create modal'); // Add this for debugging
            setShowCreateModal(false)
          
          }}
          onCreate={handleCreateInvoice}
        />
      )}

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
          }}
          onUpdateStatus={handleUpdateInvoiceStatus}
        />
      )}
    </div>
  );
};