import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Mail, 
  Printer, 
  FileText, 
  Calendar, 
  DollarSign,
  User,
  Building,
  Phone,
  MapPin,
  CreditCard,
  Tag,
  Percent,
  Receipt
} from 'lucide-react';
import { Invoice } from '../types';
import { getCompanyInfo } from '../data/companyInfo';
import { formatCurrency, formatDate } from '../utils/dateUtils';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onUpdateStatus?: (invoiceId: string, status: Invoice['status']) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  onUpdateStatus
}) => {
  const [currentStatus, setCurrentStatus] = useState(invoice.status);
  const companyInfo = getCompanyInfo();

  const handleStatusChange = (newStatus: Invoice['status']) => {
    setCurrentStatus(newStatus);
    if (onUpdateStatus) {
      onUpdateStatus(invoice.id, newStatus);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real application, this would generate and download a PDF
    alert('PDF download functionality would be implemented here');
  };

  const handleEmail = () => {
    // In a real application, this would open email client or send email
    alert('Email functionality would be implemented here');
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
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const isOverdue = invoice.status !== 'paid' && new Date() > invoice.dueDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header - Non-printable */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 p-4 sm:p-6 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-600 sm:w-6 sm:h-6" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invoice {invoice.invoiceNumber}</h2>
              <p className="text-gray-600 text-xs sm:text-sm">
                {invoice.customerInfo.customerType === 'reseller' ? 'Reseller Invoice' : 'Standard Invoice'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Selector */}
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as Invoice['status'])}
              className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={handleEmail}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
            >
              <Mail size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
            >
              <Printer size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs sm:text-sm"
            >
              <Download size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content - A4 Optimized and Printable */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(98vh-100px)] sm:max-h-[calc(95vh-120px)] print:max-h-none print:overflow-visible print:p-6" 
             style={{ 
               maxWidth: '100%', 
               margin: '0 auto',
               fontSize: '12px',
               lineHeight: '1.4'
             }}>
          {/* Company Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-6 sm:mb-8 print:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="text-2xl sm:text-4xl print:text-3xl">{companyInfo.logo}</div>
              <div>
                <h1 className="text-xl sm:text-2xl print:text-xl font-bold text-gray-900">{companyInfo.name}</h1>
                <div className="text-gray-600 text-xs sm:text-sm print:text-xs mt-1">
                  <p>{companyInfo.address.street}</p>
                  <p>{companyInfo.address.city}, {companyInfo.address.state} {companyInfo.address.zipCode}</p>
                  <p>{companyInfo.address.country}</p>
                  <div className="flex flex-col sm:flex-row sm:gap-4 mt-2 print:gap-2">
                    <span>📞 {companyInfo.phone}</span>
                    <span>✉️ {companyInfo.email}</span>
                  </div>
                  {companyInfo.website && <p>🌐 {companyInfo.website}</p>}
                  {companyInfo.taxId && <p>Tax ID: {companyInfo.taxId}</p>}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <h2 className="text-2xl sm:text-3xl print:text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <div className="text-gray-600 text-sm sm:text-base print:text-xs">
                <p className="text-base sm:text-lg print:text-sm font-semibold">{invoice.invoiceNumber}</p>
                <p>Issue Date: {formatDate(invoice.issueDate)}</p>
                <p>Due Date: {formatDate(invoice.dueDate)}</p>
                <div className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mt-2 print:text-xs ${getStatusColor(currentStatus)}`}>
                  {currentStatus.toUpperCase()}
                </div>
                {isOverdue && currentStatus !== 'paid' && (
                  <p className="text-red-600 font-semibold mt-1 text-xs sm:text-sm print:text-xs">OVERDUE</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 print:gap-6 mb-6 sm:mb-8 print:mb-6">
            <div>
              <h3 className="text-base sm:text-lg print:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 print:mb-2 flex items-center gap-2">
                <User size={16} className="sm:w-5 sm:h-5 print:hidden" />
                Bill To:
              </h3>
              <div className="bg-gray-50 p-3 sm:p-4 print:p-3 rounded-lg print:border print:border-gray-300">
                <p className="font-semibold text-gray-900 text-sm sm:text-base print:text-sm">{invoice.customerInfo.name}</p>
                <div className="text-gray-600 print:text-xs mt-2 space-y-1 text-xs sm:text-sm">
                  {invoice.customerInfo.billingAddress ? (
                    <>
                      <p className="flex items-center gap-2">
                        <MapPin size={12} className="sm:w-3.5 sm:h-3.5 print:hidden flex-shrink-0" />
                        <span className="print:inline">{invoice.customerInfo.billingAddress.street}</span>
                      </p>
                      <p className="ml-5 sm:ml-6 print:ml-0">
                        {invoice.customerInfo.billingAddress.city}, {invoice.customerInfo.billingAddress.state}
                      </p>
                      <p className="ml-5 sm:ml-6 print:ml-0">
                        {invoice.customerInfo.billingAddress.zipCode}, {invoice.customerInfo.billingAddress.country}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No billing address provided</p>
                  )}
                  {invoice.customerInfo.phone && (
                    <p className="flex items-center gap-2 mt-3 print:mt-2">
                      <Phone size={12} className="sm:w-3.5 sm:h-3.5 print:hidden flex-shrink-0" />
                      <span>{invoice.customerInfo.phone}</span>
                    </p>
                  )}
                  {invoice.customerInfo.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={12} className="sm:w-3.5 sm:h-3.5 print:hidden flex-shrink-0" />
                      <span className="break-all sm:break-normal">{invoice.customerInfo.email}</span>
                    </p>
                  )}
                  {invoice.customerInfo.taxId && (
                    <p className="flex items-center gap-2">
                      <Receipt size={12} className="sm:w-3.5 sm:h-3.5 print:hidden flex-shrink-0" />
                      <span>Tax ID: {invoice.customerInfo.taxId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reseller Information (if applicable) */}
            {invoice.customerInfo.customerType === 'reseller' && invoice.customerInfo.resellerInfo && (
              <div>
                <h3 className="text-base sm:text-lg print:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 print:mb-2 flex items-center gap-2">
                  <Building size={16} className="sm:w-5 sm:h-5 print:hidden" />
                  Reseller Information:
                </h3>
                <div className="bg-blue-50 p-3 sm:p-4 print:p-3 rounded-lg border border-blue-200">
                  <div className="space-y-2 print:space-y-1 text-xs sm:text-sm">
                    <p className="flex items-center gap-2 print:text-xs">
                      <Tag size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600 print:hidden flex-shrink-0" />
                      <span className="font-medium">Reseller ID:</span> {invoice.customerInfo.resellerInfo.resellerId}
                    </p>
                    <p className="flex items-center gap-2 print:text-xs">
                      <Percent size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600 print:hidden flex-shrink-0" />
                      <span className="font-medium">Discount Rate:</span> {invoice.customerInfo.resellerInfo.discountRate}%
                    </p>
                    <p className="flex items-center gap-2 print:text-xs">
                      <Receipt size={12} className="sm:w-3.5 sm:h-3.5 text-blue-600 print:hidden flex-shrink-0" />
                      <span className="font-medium">Min Order Qty:</span> {invoice.customerInfo.resellerInfo.minimumOrderQuantity}
                    </p>
                    {invoice.customerInfo.resellerInfo.specialTerms && (
                      <p className="text-xs sm:text-sm print:text-xs text-blue-700 mt-2 print:mt-1">
                        <span className="font-medium">Special Terms:</span> {invoice.customerInfo.resellerInfo.specialTerms}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information (for standard customers) */}
            {invoice.customerInfo.customerType === 'standard' && (
              <div>
                <h3 className="text-base sm:text-lg print:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 print:mb-2 flex items-center gap-2">
                  <CreditCard size={16} className="sm:w-5 sm:h-5 print:hidden" />
                  Payment Information:
                </h3>
                <div className="bg-gray-50 p-3 sm:p-4 print:p-3 rounded-lg print:border print:border-gray-300">
                  <p className="flex items-center gap-2 print:text-xs text-xs sm:text-sm">
                    <DollarSign size={12} className="sm:w-3.5 sm:h-3.5 print:hidden flex-shrink-0" />
                    <span className="font-medium">Payment Method:</span> {invoice.paymentMethod?.replace('_', ' ')?.toUpperCase() || 'Not specified'}
                  </p>
                  <p className="flex items-center gap-2 mt-2 print:mt-1 print:text-xs text-xs sm:text-sm">
                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5 print:hidden flex-shrink-0" />
                    <span className="font-medium">Payment Terms:</span>
                  </p>
                  <p className="text-xs sm:text-sm print:text-xs text-gray-600 mt-1">{invoice.paymentTerms || 'Standard terms apply'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="mb-6 sm:mb-8 print:mb-6">
            <h3 className="text-base sm:text-lg print:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 print:mb-3">Items & Services</h3>
            
            {/* Mobile View - Stacked Cards */}
            <div className="block sm:hidden space-y-3 print:hidden">
              {(invoice.items || []).map((item: any, index: number) => (
                <div key={item.id || index} className="bg-gray-50 p-3 rounded-lg border">
                  <div className="font-medium text-gray-900 mb-2">{item.productName}</div>
                  {item.description && (
                    <div className="text-xs text-gray-600 mb-2">{item.description}</div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Qty:</span> {item.quantity}
                    </div>
                    <div>
                      <span className="font-medium">Unit Price:</span> {formatCurrency(item.unitPrice)}
                    </div>
                    {invoice.customerInfo.customerType === 'reseller' && (
                      <>
                        <div>
                          <span className="font-medium">List Price:</span> {item.originalPrice ? formatCurrency(item.originalPrice) : '-'}
                        </div>
                        <div>
                          <span className="font-medium">Discount:</span> {item.discountPercentage ? `-${item.discountPercentage}%` : '-'}
                        </div>
                      </>
                    )}
                    <div className="col-span-2 text-right pt-2 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">Total: {formatCurrency(item.lineTotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border border-gray-200 print:text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">Description</th>
                    <th className="text-center p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">Qty</th>
                    {invoice.customerInfo.customerType === 'reseller' && (
                      <>
                        <th className="text-right p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">List Price</th>
                        <th className="text-center p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">Discount</th>
                      </>
                    )}
                    <th className="text-right p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">Unit Price</th>
                    <th className="text-right p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item: any, index: number) => (
                    <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 sm:p-3 print:p-2 border-b border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">{item.productName}</p>
                          {item.description && (
                            <p className="text-xs print:text-xs text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-center p-2 sm:p-3 print:p-2 border-b border-gray-200 text-xs sm:text-sm">{item.quantity}</td>
                      {invoice.customerInfo.customerType === 'reseller' && (
                        <>
                          <td className="text-right p-2 sm:p-3 print:p-2 border-b border-gray-200 text-xs sm:text-sm">
                            {item.originalPrice ? formatCurrency(item.originalPrice) : '-'}
                          </td>
                          <td className="text-center p-2 sm:p-3 print:p-2 border-b border-gray-200">
                            {item.discountPercentage ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs print:text-xs">
                                -{item.discountPercentage}%
                              </span>
                            ) : '-'}
                          </td>
                        </>
                      )}
                      <td className="text-right p-2 sm:p-3 print:p-2 border-b border-gray-200 text-xs sm:text-sm">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="text-right p-2 sm:p-3 print:p-2 border-b border-gray-200 font-semibold text-xs sm:text-sm">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-center sm:justify-end mb-6 sm:mb-8 print:mb-6">
            <div className="w-full sm:max-w-md">
              <div className="bg-gray-50 p-3 sm:p-4 print:p-3 rounded-lg print:border print:border-gray-300">
                {invoice.customerInfo.customerType === 'reseller' && (invoice.discountAmount || 0) > 0 && (
                  <>
                    <div className="flex justify-between py-1 sm:py-2 print:py-1 print:text-xs text-xs sm:text-sm">
                      <span className="text-gray-600">Subtotal (List Price):</span>
                      <span className="font-semibold">{formatCurrency(invoice.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 sm:py-2 print:py-1 text-green-700 print:text-xs text-xs sm:text-sm">
                      <span>Reseller Discount ({invoice.discountPercentage || 0}%):</span>
                      <span className="font-semibold">-{formatCurrency(invoice.discountAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1 sm:py-2 print:py-1 border-t border-gray-200 print:text-xs text-xs sm:text-sm">
                      <span className="text-gray-600">Discounted Subtotal:</span>
                      <span className="font-semibold">{formatCurrency((invoice.subtotal || 0) - (invoice.discountAmount || 0))}</span>
                    </div>
                  </>
                )}
                
                {invoice.customerInfo.customerType === 'standard' && (
                  <div className="flex justify-between py-1 sm:py-2 print:py-1 print:text-xs text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(invoice.subtotal || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 sm:py-2 print:py-1 print:text-xs text-xs sm:text-sm">
                  <span className="text-gray-600">Tax ({invoice.taxRate || 0}%):</span>
                  <span className="font-semibold">{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>
                
                <div className="flex justify-between py-2 sm:py-3 print:py-2 border-t border-gray-300 text-base sm:text-lg print:text-sm">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(invoice.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Accepted */}
          <div className="mb-6 sm:mb-8 print:mb-6">
            <h3 className="text-base sm:text-lg print:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 print:mb-2">Payment Methods Accepted</h3>
            <div className="bg-gray-50 p-3 sm:p-4 print:p-3 rounded-lg print:border print:border-gray-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:gap-2 text-xs sm:text-sm print:text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="sm:w-4 sm:h-4 text-blue-600 print:hidden flex-shrink-0" />
                  <span>Credit/Debit Cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="sm:w-4 sm:h-4 text-green-600 print:hidden flex-shrink-0" />
                  <span>Cash</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={14} className="sm:w-4 sm:h-4 text-purple-600 print:hidden flex-shrink-0" />
                  <span>Bank Transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="sm:w-4 sm:h-4 text-orange-600 print:hidden flex-shrink-0" />
                  <span>Check</span>
                </div>
              </div>
              
              {invoice.customerInfo.customerType === 'reseller' && (
                <div className="mt-3 print:mt-2 pt-3 print:pt-2 border-t border-gray-200">
                  <p className="text-xs sm:text-sm print:text-xs text-blue-700">
                    <strong>Reseller Payment Terms:</strong> {invoice.paymentTerms || 'Standard reseller terms apply'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-6 sm:mb-8 print:mb-6">
              <h3 className="text-base sm:text-lg print:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 print:mb-2">Notes</h3>
              <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 print:p-3 rounded-lg">
                <p className="text-gray-700 print:text-xs text-xs sm:text-sm">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6 print:pt-4 text-center text-xs sm:text-sm print:text-xs text-gray-600">
            <p>Thank you for your business!</p>
            <p className="mt-2 print:mt-1">
              For questions about this invoice, please contact us at {companyInfo.email} or {companyInfo.phone}
            </p>
            {invoice.customerInfo.customerType === 'reseller' && (
              <p className="mt-2 print:mt-1 text-blue-700 font-medium">
                This invoice reflects authorized reseller pricing and terms.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};