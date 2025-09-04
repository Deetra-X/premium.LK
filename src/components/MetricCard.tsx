import React from 'react';
import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  className = '' 
}) => {
  return (
    <div className={`bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className="flex-shrink-0">
          <Icon size={32} className="text-blue-400" />
        </div>
      </div>
    </div>
  );
};