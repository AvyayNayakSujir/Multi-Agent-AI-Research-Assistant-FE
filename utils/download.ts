export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers or restricted environments
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

export function downloadAsMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Format filename nicely
  const formattedName = filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  link.setAttribute('download', `${formattedName || 'research-report'}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printMarkdown(title: string, htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            color: #111827;
          }
          h1 {
            font-size: 2.25em;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.3em;
            margin-top: 0;
          }
          h2 {
            font-size: 1.5em;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.3em;
          }
          h3 {
            font-size: 1.25em;
          }
          p {
            margin-top: 0;
            margin-bottom: 1em;
          }
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          pre {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.875em;
            border: 1px solid #e5e7eb;
            margin-bottom: 1em;
          }
          code {
            background-color: #f3f4f6;
            padding: 2px 4px;
            border-radius: 4px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 0.875em;
            color: #eb5757;
          }
          pre code {
            background-color: transparent;
            padding: 0;
            border-radius: 0;
            color: inherit;
          }
          blockquote {
            border-left: 4px solid #d1d5db;
            padding-left: 16px;
            color: #4b5563;
            margin: 0 0 16px 0;
            font-style: italic;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
          }
          img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 1em;
            padding-left: 1.5em;
          }
          li {
            margin-bottom: 0.25em;
          }
          @media print {
            body {
              padding: 0;
            }
            @page {
              margin: 20mm;
            }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div>${htmlContent}</div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
