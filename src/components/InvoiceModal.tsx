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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header - Non-printable */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invoice {invoice.invoiceNumber}</h2>
              <p className="text-gray-600 text-sm">
                {invoice.customerInfo.customerType === 'reseller' ? 'Reseller Invoice' : 'Standard Invoice'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status Selector */}
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as Invoice['status'])}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download size={16} />
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Content - A4 Optimized and Printable */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)] print:max-h-none print:overflow-visible print:p-6" 
             style={{ 
               width: '210mm', 
               minHeight: '297mm', 
               maxWidth: '100%', 
               margin: '0 auto',
               fontSize: '12px',
               lineHeight: '1.4'
             }}>
          {/* Company Header */}
          <div className="flex justify-between items-start mb-8 print:mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl print:text-3xl">{companyInfo.logo}</div>
              <div>
                <h1 className="text-2xl print:text-xl font-bold text-gray-900">{companyInfo.name}</h1>
                <div className="text-gray-600 text-sm print:text-xs mt-1">
                  <p>{companyInfo.address.street}</p>
                  <p>{companyInfo.address.city}, {companyInfo.address.state} {companyInfo.address.zipCode}</p>
                  <p>{companyInfo.address.country}</p>
                  <div className="flex gap-4 mt-2 print:gap-2">
                    <span>📞 {companyInfo.phone}</span>
                    <span>✉️ {companyInfo.email}</span>
                  </div>
                  {companyInfo.website && <p>🌐 {companyInfo.website}</p>}
                  {companyInfo.taxId && <p>Tax ID: {companyInfo.taxId}</p>}
                </div>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-3xl print:text-2xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <div className="text-gray-600 print:text-xs">
                <p className="text-lg print:text-sm font-semibold">{invoice.invoiceNumber}</p>
                <p>Issue Date: {formatDate(invoice.issueDate)}</p>
                <p>Due Date: {formatDate(invoice.dueDate)}</p>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 print:text-xs ${getStatusColor(currentStatus)}`}>
                  {currentStatus.toUpperCase()}
                </div>
                {isOverdue && currentStatus !== 'paid' && (
                  <p className="text-red-600 font-semibold mt-1 print:text-xs">OVERDUE</p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-6 mb-8 print:mb-6">
            <div>
              <h3 className="text-lg print:text-sm font-semibold text-gray-900 mb-3 print:mb-2 flex items-center gap-2">
                <User size={20} className="print:hidden" />
                Bill To:
              </h3>
              <div className="bg-gray-50 p-4 print:p-3 rounded-lg print:border print:border-gray-300">
                <p className="font-semibold text-gray-900 print:text-sm">{invoice.customerInfo.name}</p>
                <div className="text-gray-600 print:text-xs mt-2 space-y-1">
                  {invoice.customerInfo.billingAddress ? (
                    <>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="print:hidden" />
                        <span className="print:inline">{invoice.customerInfo.billingAddress.street}</span>
                      </p>
                      <p className="ml-6 print:ml-0">
                        {invoice.customerInfo.billingAddress.city}, {invoice.customerInfo.billingAddress.state}
                      </p>
                      <p className="ml-6 print:ml-0">
                        {invoice.customerInfo.billingAddress.zipCode}, {invoice.customerInfo.billingAddress.country}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500 italic">No billing address provided</p>
                  )}
                  {invoice.customerInfo.phone && (
                    <p className="flex items-center gap-2 mt-3 print:mt-2">
                      <Phone size={14} className="print:hidden" />
                      <span>{invoice.customerInfo.phone}</span>
                    </p>
                  )}
                  {invoice.customerInfo.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={14} className="print:hidden" />
                      <span>{invoice.customerInfo.email}</span>
                    </p>
                  )}
                  {invoice.customerInfo.taxId && (
                    <p className="flex items-center gap-2">
                      <Receipt size={14} className="print:hidden" />
                      <span>Tax ID: {invoice.customerInfo.taxId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Reseller Information (if applicable) */}
            {invoice.customerInfo.customerType === 'reseller' && invoice.customerInfo.resellerInfo && (
              <div>
                <h3 className="text-lg print:text-sm font-semibold text-gray-900 mb-3 print:mb-2 flex items-center gap-2">
                  <Building size={20} className="print:hidden" />
                  Reseller Information:
                </h3>
                <div className="bg-blue-50 p-4 print:p-3 rounded-lg border border-blue-200">
                  <div className="space-y-2 print:space-y-1">
                    <p className="flex items-center gap-2 print:text-xs">
                      <Tag size={14} className="text-blue-600 print:hidden" />
                      <span className="font-medium">Reseller ID:</span> {invoice.customerInfo.resellerInfo.resellerId}
                    </p>
                    <p className="flex items-center gap-2 print:text-xs">
                      <Percent size={14} className="text-blue-600 print:hidden" />
                      <span className="font-medium">Discount Rate:</span> {invoice.customerInfo.resellerInfo.discountRate}%
                    </p>
                    <p className="flex items-center gap-2 print:text-xs">
                      <Receipt size={14} className="text-blue-600 print:hidden" />
                      <span className="font-medium">Min Order Qty:</span> {invoice.customerInfo.resellerInfo.minimumOrderQuantity}
                    </p>
                    {invoice.customerInfo.resellerInfo.specialTerms && (
                      <p className="text-sm print:text-xs text-blue-700 mt-2 print:mt-1">
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
                <h3 className="text-lg print:text-sm font-semibold text-gray-900 mb-3 print:mb-2 flex items-center gap-2">
                  <CreditCard size={20} className="print:hidden" />
                  Payment Information:
                </h3>
                <div className="bg-gray-50 p-4 print:p-3 rounded-lg print:border print:border-gray-300">
                  <p className="flex items-center gap-2 print:text-xs">
                    <DollarSign size={14} className="print:hidden" />
                    <span className="font-medium">Payment Method:</span> {invoice.paymentMethod?.replace('_', ' ')?.toUpperCase() || 'Not specified'}
                  </p>
                  <p className="flex items-center gap-2 mt-2 print:mt-1 print:text-xs">
                    <Calendar size={14} className="print:hidden" />
                    <span className="font-medium">Payment Terms:</span>
                  </p>
                  <p className="text-sm print:text-xs text-gray-600 mt-1">{invoice.paymentTerms || 'Standard terms apply'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Items */}
          <div className="mb-8 print:mb-6">
            <h3 className="text-lg print:text-sm font-semibold text-gray-900 mb-4 print:mb-3">Items & Services</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 print:text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 print:p-2 border-b border-gray-200 font-semibold">Description</th>
                    <th className="text-center p-3 print:p-2 border-b border-gray-200 font-semibold">Qty</th>
                    {invoice.customerInfo.customerType === 'reseller' && (
                      <>
                        <th className="text-right p-3 print:p-2 border-b border-gray-200 font-semibold">List Price</th>
                        <th className="text-center p-3 print:p-2 border-b border-gray-200 font-semibold">Discount</th>
                      </>
                    )}
                    <th className="text-right p-3 print:p-2 border-b border-gray-200 font-semibold">Unit Price</th>
                    <th className="text-right p-3 print:p-2 border-b border-gray-200 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3 print:p-2 border-b border-gray-200">
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {item.description && (
                            <p className="text-sm print:text-xs text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-center p-3 print:p-2 border-b border-gray-200">{item.quantity}</td>
                      {invoice.customerInfo.customerType === 'reseller' && (
                        <>
                          <td className="text-right p-3 print:p-2 border-b border-gray-200">
                            {item.originalPrice ? formatCurrency(item.originalPrice) : '-'}
                          </td>
                          <td className="text-center p-3 print:p-2 border-b border-gray-200">
                            {item.discountPercentage ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm print:text-xs">
                                -{item.discountPercentage}%
                              </span>
                            ) : '-'}
                          </td>
                        </>
                      )}
                      <td className="text-right p-3 print:p-2 border-b border-gray-200">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="text-right p-3 print:p-2 border-b border-gray-200 font-semibold">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8 print:mb-6">
            <div className="w-full max-w-md">
              <div className="bg-gray-50 p-4 print:p-3 rounded-lg print:border print:border-gray-300">
                {invoice.customerInfo.customerType === 'reseller' && (invoice.discountAmount || 0) > 0 && (
                  <>
                    <div className="flex justify-between py-2 print:py-1 print:text-xs">
                      <span className="text-gray-600">Subtotal (List Price):</span>
                      <span className="font-semibold">{formatCurrency(invoice.subtotal || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 print:py-1 text-green-700 print:text-xs">
                      <span>Reseller Discount ({invoice.discountPercentage || 0}%):</span>
                      <span className="font-semibold">-{formatCurrency(invoice.discountAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between py-2 print:py-1 border-t border-gray-200 print:text-xs">
                      <span className="text-gray-600">Discounted Subtotal:</span>
                      <span className="font-semibold">{formatCurrency((invoice.subtotal || 0) - (invoice.discountAmount || 0))}</span>
                    </div>
                  </>
                )}
                
                {invoice.customerInfo.customerType === 'standard' && (
                  <div className="flex justify-between py-2 print:py-1 print:text-xs">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(invoice.subtotal || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 print:py-1 print:text-xs">
                  <span className="text-gray-600">Tax ({invoice.taxRate || 0}%):</span>
                  <span className="font-semibold">{formatCurrency(invoice.taxAmount || 0)}</span>
                </div>
                
                <div className="flex justify-between py-3 print:py-2 border-t border-gray-300 text-lg print:text-sm">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(invoice.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Accepted */}
          <div className="mb-8 print:mb-6">
            <h3 className="text-lg print:text-sm font-semibold text-gray-900 mb-3 print:mb-2">Payment Methods Accepted</h3>
            <div className="bg-gray-50 p-4 print:p-3 rounded-lg print:border print:border-gray-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2 text-sm print:text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-600 print:hidden" />
                  <span>Credit/Debit Cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600 print:hidden" />
                  <span>Cash</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-purple-600 print:hidden" />
                  <span>Bank Transfer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt size={16} className="text-orange-600 print:hidden" />
                  <span>Check</span>
                </div>
              </div>
              
              {invoice.customerInfo.customerType === 'reseller' && (
                <div className="mt-3 print:mt-2 pt-3 print:pt-2 border-t border-gray-200">
                  <p className="text-sm print:text-xs text-blue-700">
                    <strong>Reseller Payment Terms:</strong> {invoice.paymentTerms || 'Standard reseller terms apply'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg print:text-sm font-semibold text-gray-900 mb-3 print:mb-2">Notes</h3>
              <div className="bg-yellow-50 border border-yellow-200 p-4 print:p-3 rounded-lg">
                <p className="text-gray-700 print:text-xs">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 print:pt-4 text-center text-sm print:text-xs text-gray-600">
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