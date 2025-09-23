import React from 'react';
import { Invoice, InvoiceItem } from '../types/index';
import { getCompanyInfo } from '../data/companyInfo';
import { formatCurrency, formatDate } from '../utils/dateUtils';

interface Props {
  invoice: Invoice;
}

// A print-only full invoice view, optimized for A4 export
export const InvoicePrint: React.FC<Props> = ({ invoice }) => {
  const companyInfo = getCompanyInfo();
  const status = invoice.status;
  const isOverdue = status !== 'paid' && new Date() > invoice.dueDate;

  return (
    <div className="invoice-a4" style={{ width: '210mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4', padding: '16px' }}>
      {/* optional header removed; using unified InvoiceBody elsewhere */}
      {/* Company + Invoice Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{companyInfo.name}</div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>
            <div>{companyInfo.address.street}</div>
            <div>{companyInfo.address.city}, {companyInfo.address.state} {companyInfo.address.zipCode}</div>
            <div>{companyInfo.address.country}</div>
            <div style={{ marginTop: 4 }}>📞 {companyInfo.phone} &nbsp; ✉️ {companyInfo.email}</div>
            {companyInfo.website && <div>🌐 {companyInfo.website}</div>}
            {companyInfo.taxId && <div>Tax ID: {companyInfo.taxId}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 4 }}>INVOICE</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{invoice.invoiceNumber}</div>
          <div style={{ color: '#555', fontSize: 12, marginTop: 4 }}>Issue Date: {formatDate(invoice.issueDate)}</div>
          <div style={{ color: '#555', fontSize: 12 }}>Due Date: {formatDate(invoice.dueDate)}</div>
          <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8' }}>{status.toUpperCase()}</div>
          {isOverdue && (
            <div style={{ color: '#DC2626', fontWeight: 700, marginTop: 4, fontSize: 12 }}>OVERDUE</div>
          )}
        </div>
      </div>

      {/* Bill To + Secondary panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>Bill To</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontWeight: 700, color: '#111' }}>{invoice.customerInfo.name || 'Customer'}</div>
            {invoice.customerInfo.phone && (
              <div style={{ fontWeight: 700, color: '#111' }}>{invoice.customerInfo.phone}</div>
            )}
          </div>
        </div>

        {invoice.customerInfo.customerType === 'standard' ? (
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>Payment Information</div>
            <div style={{ fontSize: 12, color: '#374151' }}>Payment Method: {invoice.paymentMethod?.replace('_', ' ')?.toUpperCase() || 'Not specified'}</div>
            <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>Payment Terms:</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{invoice.paymentTerms || 'Standard terms apply'}</div>
          </div>
        ) : (
          <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>Reseller Information</div>
            {invoice.customerInfo.resellerInfo && (
              <div style={{ fontSize: 12, color: '#1E40AF' }}>
                <div>Reseller ID: {invoice.customerInfo.resellerInfo.resellerId}</div>
                <div>Discount Rate: {invoice.customerInfo.resellerInfo.discountRate}%</div>
                <div>Min Order Qty: {invoice.customerInfo.resellerInfo.minimumOrderQuantity}</div>
                {invoice.customerInfo.resellerInfo.specialTerms && <div style={{ marginTop: 4 }}>Special Terms: {invoice.customerInfo.resellerInfo.specialTerms}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items Table */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#111', marginBottom: 8 }}>Items & Services</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #E5E7EB', padding: 6 }}>Description</th>
              <th style={{ textAlign: 'center', borderBottom: '1px solid #E5E7EB', padding: 6 }}>Qty</th>
              {invoice.customerInfo.customerType === 'reseller' && (
                <>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #E5E7EB', padding: 6 }}>List Price</th>
                  <th style={{ textAlign: 'center', borderBottom: '1px solid #E5E7EB', padding: 6 }}>Discount</th>
                </>
              )}
              <th style={{ textAlign: 'right', borderBottom: '1px solid #E5E7EB', padding: 6 }}>Unit Price</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #E5E7EB', padding: 6 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item: InvoiceItem, index: number) => (
              <tr key={item.id || index}>
                <td style={{ borderBottom: '1px solid #F1F5F9', padding: 6 }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{item.productName}</div>
                  {item.description && <div style={{ color: '#6B7280', fontSize: 11 }}>{item.description}</div>}
                </td>
                <td style={{ textAlign: 'center', borderBottom: '1px solid #F1F5F9', padding: 6 }}>{item.quantity}</td>
                {invoice.customerInfo.customerType === 'reseller' && (
                  <>
                    <td style={{ textAlign: 'right', borderBottom: '1px solid #F1F5F9', padding: 6 }}>{item.originalPrice ? formatCurrency(item.originalPrice) : '-'}</td>
                    <td style={{ textAlign: 'center', borderBottom: '1px solid #F1F5F9', padding: 6 }}>{item.discountPercentage ? `-${item.discountPercentage}%` : '-'}</td>
                  </>
                )}
                <td style={{ textAlign: 'right', borderBottom: '1px solid #F1F5F9', padding: 6 }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: 'right', borderBottom: '1px solid #F1F5F9', padding: 6, fontWeight: 700 }}>{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ minWidth: 260, background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
          {invoice.customerInfo.customerType === 'reseller' && (invoice.discountAmount || 0) > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#4B5563' }}>Subtotal (List Price):</span>
                <strong>{formatCurrency(invoice.subtotal || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#047857' }}>
                <span>Reseller Discount ({invoice.discountPercentage || 0}%):</span>
                <strong>-{formatCurrency(invoice.discountAmount || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #E5E7EB' }}>
                <span style={{ color: '#4B5563' }}>Discounted Subtotal:</span>
                <strong>{formatCurrency((invoice.subtotal || 0) - (invoice.discountAmount || 0))}</strong>
              </div>
            </>
          )}

          {invoice.customerInfo.customerType === 'standard' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#4B5563' }}>Subtotal:</span>
              <strong>{formatCurrency(invoice.subtotal || 0)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#4B5563' }}>Tax ({invoice.taxRate || 0}%):</span>
            <strong>{formatCurrency(invoice.taxAmount || 0)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #D1D5DB', fontSize: 14 }}>
            <span style={{ fontWeight: 800, color: '#111' }}>Total Amount:</span>
            <span style={{ fontWeight: 800, color: '#111' }}>{formatCurrency(invoice.totalAmount || 0)}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>Payment Methods Accepted</div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, fontSize: 12, color: '#374151' }}>
          <div>Credit/Debit Cards, Cash, Bank Transfer, Check</div>
          {invoice.customerInfo.customerType === 'reseller' && (
            <div style={{ marginTop: 6, color: '#1D4ED8' }}>
              <strong>Reseller Payment Terms:</strong> {invoice.paymentTerms || 'Standard reseller terms apply'}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#111', marginBottom: 6 }}>Notes</div>
          <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 8, padding: 12, color: '#374151' }}>{invoice.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 12, textAlign: 'center', fontSize: 12, color: '#4B5563' }}>
        <div>Thank you for your business!</div>
        <div style={{ marginTop: 4 }}>For questions about this invoice, please contact us at {companyInfo.email} or {companyInfo.phone}</div>
        {invoice.customerInfo.customerType === 'reseller' && (
          <div style={{ marginTop: 4, color: '#1D4ED8', fontWeight: 600 }}>This invoice reflects authorized reseller pricing and terms.</div>
        )}
      </div>
    </div>
  );
};

export default InvoicePrint;
