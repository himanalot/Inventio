'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface DocumentMetadata {
  title?: string;
  authors?: string;
  publication?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  issue_date?: string;
  doi?: string;
  issn?: string;
  url?: string;
  date?: string;
}

interface DocumentInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  summary?: string;
  abstract?: string;
  metadata?: DocumentMetadata;
  isLoading?: boolean;
  documentName?: string;
}

const DocumentInfoSidebar: React.FC<DocumentInfoSidebarProps> = ({
  isOpen,
  onClose,
  summary,
  abstract,
  metadata = {},
  isLoading,
  documentName
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'related'>('info');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  
  // Parse and format the summary and abstract
  const summaryText = summary && summary.trim() ? summary : 'Unavailable';
  const abstractText = abstract && abstract.trim() ? abstract : 'Unavailable';
  
  // Reset expanded states when the sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setIsSummaryExpanded(false);
      setIsAbstractExpanded(false);
    }
  }, [isOpen]);

  // Ensure metadata is always an object
  const metadataObj = metadata || {};

  return (
    <div
      className={cn(
        "absolute top-0 right-0 z-30 h-full border-l border-border bg-background transition-all duration-300 ease-in-out",
        isOpen ? "w-96" : "w-0 border-l-0"
      )}
    >
      {isOpen && (
        <div className="flex flex-col gap-4 h-full pt-3">
          {/* Tab selector */}
          <div 
            role="group" 
            dir="ltr" 
            className="flex items-center justify-between w-full px-3" 
            tabIndex={0}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-state={activeTab === 'info' ? "on" : "off"}
                role="radio"
                aria-checked={activeTab === 'info'}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm text-textGray4 font-medium",
                  "ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "data-[state=on]:bg-muted data-[state=on]:text-accent-foreground",
                  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                  "bg-transparent h-7 px-1.5 min-w-7 gap-1.5"
                )}
                onClick={() => setActiveTab('info')}
                tabIndex={-1}
              >
                Info
              </button>
              <button
                type="button"
                data-state={activeTab === 'related' ? "on" : "off"}
                role="radio"
                aria-checked={activeTab === 'related'}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm text-textGray4 font-medium",
                  "ring-offset-background transition-colors hover:bg-muted hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "data-[state=on]:bg-muted data-[state=on]:text-accent-foreground",
                  "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                  "bg-transparent h-7 px-1.5 min-w-7 gap-1.5"
                )}
                onClick={() => setActiveTab('related')}
                tabIndex={-1}
              >
                Related
              </button>
            </div>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-7 w-7"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Content area */}
          <div dir="ltr" className="relative overflow-hidden h-full pb-6 px-3">
            <div className="w-full h-full rounded-[inherit]" style={{ overflow: "hidden auto" }}>
              <div style={{ minWidth: "100%", display: "table" }}>
                <form className="w-full">
                  <fieldset className="flex flex-col w-full min-w-0 h-full gap-[26px]">
                    {/* Summary section */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2 group min-h-6">
                        <p className="text-textGray5 font-semibold text-sm pl-1.5">Summary</p>
                      </div>
                      <div className="flex flex-col">
                        <div>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="relative group">
                              <textarea
                                placeholder="Unavailable"
                                name="summary"
                                value={isLoading ? 'Loading...' : summaryText}
                                readOnly
                                aria-invalid="false"
                                className={cn(
                                  "flex w-full rounded-md border border-input text-sm ring-offset-background",
                                  "focus-visible:outline-none disabled:cursor-not-allowed",
                                  "p-2 border-none resize-none hover:bg-muted placeholder:text-textGray4 bg-transparent",
                                  summaryText === 'Unavailable' && !isLoading ? "text-gray-400 opacity-70" : "",
                                  isSummaryExpanded ? "overflow-y-auto" : "overflow-hidden",
                                  summaryText !== 'Unavailable' && !isLoading ? "cursor-pointer" : ""
                                )}
                                style={{
                                  height: isSummaryExpanded ? "auto" : "150px",
                                  minHeight: isSummaryExpanded ? "200px" : "20px",
                                  maxHeight: isSummaryExpanded ? "600px" : "150px",
                                  transition: "height 0.2s ease-in-out, max-height 0.2s ease-in-out",
                                  display: isSummaryExpanded ? "block" : "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: isSummaryExpanded ? undefined : 7,
                                }}
                                onClick={() => {
                                  if (summaryText !== 'Unavailable' && !isLoading) {
                                    setIsSummaryExpanded(!isSummaryExpanded);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Abstract section */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2 group min-h-6">
                        <p className="text-textGray5 font-semibold text-sm pl-1.5">Abstract</p>
                      </div>
                      <div className="flex flex-col">
                        <div>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="relative group">
                              <textarea
                                placeholder="Unavailable"
                                name="abstract"
                                value={isLoading ? 'Loading...' : abstractText}
                                readOnly
                                aria-invalid="false"
                                className={cn(
                                  "flex w-full rounded-md border border-input text-sm ring-offset-background",
                                  "focus-visible:outline-none disabled:cursor-not-allowed",
                                  "p-2 border-none resize-none hover:bg-muted placeholder:text-textGray4 bg-transparent",
                                  abstractText === 'Unavailable' && !isLoading ? "text-gray-400 opacity-70" : "",
                                  isAbstractExpanded ? "overflow-y-auto" : "overflow-hidden",
                                  abstractText !== 'Unavailable' && !isLoading ? "cursor-pointer" : ""
                                )}
                                style={{
                                  height: isAbstractExpanded ? "auto" : "150px",
                                  minHeight: isAbstractExpanded ? "200px" : "20px",
                                  maxHeight: isAbstractExpanded ? "600px" : "150px",
                                  transition: "height 0.2s ease-in-out, max-height 0.2s ease-in-out",
                                  display: isAbstractExpanded ? "block" : "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: isAbstractExpanded ? undefined : 7,
                                }}
                                onClick={() => {
                                  if (abstractText !== 'Unavailable' && !isLoading) {
                                    setIsAbstractExpanded(!isAbstractExpanded);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata section */}
                    <div className="flex flex-col gap-2 pl-1.5">
                      <div className="flex gap-2 items-center min-h-6">
                        <p className="text-textGray5 font-semibold text-sm">Metadata</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        {/* Title */}
                        <MetadataField
                          label="Title"
                          value={metadataObj.title || documentName || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* Authors */}
                        <MetadataField
                          label="Authors"
                          value={metadataObj.authors || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* Publication */}
                        <MetadataField
                          label="Publication"
                          value={metadataObj.publication || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* Volume */}
                        <MetadataField
                          label="Volume"
                          value={metadataObj.volume || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* Issue */}
                        <MetadataField
                          label="Issue"
                          value={metadataObj.issue || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* Pages */}
                        <MetadataField
                          label="Pages"
                          value={metadataObj.pages || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* Issue Date */}
                        <MetadataField
                          label="Issue Date"
                          value={metadataObj.issue_date || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* DOI */}
                        {metadataObj.doi ? (
                          <div className="flex flex-col">
                            <div className="flex flex-row gap-4">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex flex-col text-textGray5 gap-2 min-w-20 py-2 h-fit">
                                DOI
                              </label>
                              <div className="w-full min-w-0 hover:bg-border p-1.5 rounded-md cursor-pointer">
                                <div className="flex items-center gap-1">
                                  <p className="underline text-sm min-w-0 text-ellipsis truncate">
                                    {metadataObj.doi}
                                  </p>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right">
                                    <path d="M7 7h10v10"></path>
                                    <path d="M7 17 17 7"></path>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <MetadataField
                            label="DOI"
                            value="Unavailable"
                            isLoading={isLoading}
                          />
                        )}
                        
                        {/* ISSN */}
                        <MetadataField
                          label="ISSN"
                          value={metadataObj.issn || 'Unavailable'}
                          isLoading={isLoading}
                        />
                        
                        {/* URL */}
                        {metadataObj.url ? (
                          <div className="flex flex-col">
                            <div className="flex flex-row gap-4">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex flex-col text-textGray5 gap-2 min-w-20 py-2 h-fit">
                                URL
                              </label>
                              <div className="w-full min-w-0 hover:bg-border p-1.5 rounded-md cursor-pointer">
                                <div className="flex items-center gap-1">
                                  <p className="underline text-sm min-w-0 text-ellipsis truncate">
                                    {metadataObj.url}
                                  </p>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right">
                                    <path d="M7 7h10v10"></path>
                                    <path d="M7 17 17 7"></path>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <MetadataField
                            label="URL"
                            value="Unavailable"
                            isLoading={isLoading}
                          />
                        )}
                        
                        {/* Added Date */}
                        <MetadataField
                          label="Added Date"
                          value={metadataObj.date || new Date().toISOString().split('T')[0] || 'Unavailable'}
                          isLoading={isLoading}
                        />
                      </div>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MetadataFieldProps {
  label: string;
  value: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const MetadataField: React.FC<MetadataFieldProps> = ({ 
  label, 
  value, 
  isLoading = false,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if the field is unavailable
  const isUnavailable = !value || value.trim() === '' || value === 'Unavailable';
  
  // Calculate appropriate height based on content
  const calculateHeight = () => {
    if (isExpanded) return "auto";
    if (!value) return "30px";
    
    const lineCount = value.split('\n').length;
    const approximateCharsPerLine = 40; // Approximation, adjust as needed
    const textLength = value.length;
    const estimatedLines = Math.max(lineCount, Math.ceil(textLength / approximateCharsPerLine));
    
    if (estimatedLines > 4) return "90px";
    if (estimatedLines > 2) return "70px";
    if (estimatedLines > 1) return "50px";
    return "30px";
  };
  
  // Check if content is long enough to need expansion
  const needsExpansion = !isUnavailable && !isLoading && value.length > 50;
  
  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-4">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex flex-col text-textGray5 gap-2 min-w-20 py-2 h-fit">
          {label}
        </label>
        <div className="flex flex-col gap-1 w-full">
          <div className="relative group">
            <textarea
              placeholder="Unavailable"
              name={label.toLowerCase()}
              value={isLoading ? 'Loading...' : (isUnavailable ? 'Unavailable' : value)}
              readOnly
              disabled={disabled}
              aria-invalid="false"
              className={cn(
                "flex w-full rounded-md border border-input text-sm ring-offset-background",
                "focus-visible:outline-none disabled:cursor-not-allowed",
                "p-2 border-none resize-none hover:bg-muted placeholder:text-textGray4 bg-transparent",
                (!isLoading && isUnavailable) && "text-gray-400 opacity-70", // Gray out any unavailable fields
                isExpanded ? "overflow-y-auto" : "overflow-hidden",
                needsExpansion ? "cursor-pointer" : ""
              )}
              style={{
                display: isExpanded ? "block" : "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: isExpanded ? undefined : 3,
                minHeight: "20px",
                maxHeight: isExpanded ? "300px" : "90px",
                height: calculateHeight(),
                transition: "height 0.2s ease-in-out, max-height 0.2s ease-in-out",
              }}
              onClick={() => {
                if (needsExpansion) {
                  setIsExpanded(!isExpanded);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentInfoSidebar; 