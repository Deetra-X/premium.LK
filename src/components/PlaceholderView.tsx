// import React from 'react';
// import { type Icon as LucideIcon } from 'lucide-react';

// interface PlaceholderViewProps {
//   title: string;
//   description: string;
//   icon: LucideIcon;
// }

// export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ 
//   title, 
//   description, 
//   icon: Icon 
// }) => {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//       <div className="bg-slate-800 rounded-full p-6 mb-6">
//         <Icon size={48} className="text-blue-400" />
//       </div>
//       <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
//       <p className="text-gray-400 max-w-md">
//         {description}
//       </p>
//       <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
//         <p className="text-sm text-gray-300">
//           This section is under development. The dashboard is fully functional.
//         </p>
//       </div>
//     </div>
//   );
// };