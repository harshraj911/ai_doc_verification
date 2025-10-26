import React from 'react';
import type { VerificationResult } from '../types';
import { VerificationStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface VerificationResultDisplayProps {
  result: VerificationResult;
}

const statusConfig = {
  [VerificationStatus.VERIFIED]: {
    label: 'Verified',
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    progressColor: 'bg-green-500',
  },
  [VerificationStatus.SUSPICIOUS]: {
    label: 'Suspicious',
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    progressColor: 'bg-yellow-500',
  },
  [VerificationStatus.UNVERIFIED]: {
    label: 'Unverified',
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    progressColor: 'bg-red-500',
  },
};


const VerificationResultDisplay: React.FC<VerificationResultDisplayProps> = ({ result }) => {
  const config = statusConfig[result.status];
  const Icon = config.icon;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Status Header */}
      <div className={`p-4 rounded-lg flex items-center space-x-3 ${config.bgColor}`}>
        <Icon className={`w-8 h-8 ${config.color}`} />
        <div>
          <h3 className={`text-xl font-bold ${config.color}`}>{config.label}</h3>
          <p className={`text-sm ${config.color.replace('600', '500')}`}>{result.summary}</p>
        </div>
      </div>

      {/* Confidence Score Card */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-slate-700">Confidence Score</h4>
          <span className={`font-bold text-lg ${config.color}`}>{(result.confidenceScore * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className={`${config.progressColor} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${result.confidenceScore * 100}%` }}></div>
        </div>
      </div>
      
      {/* Document Type Card */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-slate-700">Detected Document Type</h4>
          <span className="font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-sm">{result.documentType}</span>
        </div>
      </div>

      {/* Extracted Details Card */}
      <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h4 className="font-semibold text-slate-700 mb-2">Extracted Details</h4>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <ul className="divide-y divide-slate-200">
            {result.extractedDetails.map((detail, index) => (
              <li key={index} className="px-4 py-3 flex justify-between items-center text-sm bg-slate-50/50 even:bg-white">
                <span className="font-medium text-slate-500">{detail.field}</span>
                <span className="text-slate-800 text-right">{detail.value}</span>
              </li>
            ))}
             {result.extractedDetails.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-500 text-center">No details could be extracted.</li>
             )}
          </ul>
        </div>
      </div>

      {/* Inconsistencies Card */}
      {result.inconsistencies && result.inconsistencies.length > 0 && (
        <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 shadow-sm">
          <h4 className="font-semibold text-yellow-800 mb-2">Potential Inconsistencies</h4>
          <ul className="space-y-2">
            {result.inconsistencies.map((item, index) => (
              <li key={index} className="flex items-start text-sm">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-yellow-900/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VerificationResultDisplay;