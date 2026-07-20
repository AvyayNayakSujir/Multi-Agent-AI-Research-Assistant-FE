import { jsPDF } from 'jspdf';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
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
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
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

/**
 * Strips raw markdown syntax (*, #, `, etc.) while preserving leading and trailing spaces
 */
function cleanMarkdownSegment(str: string): string {
  return str
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/, '')
    .replace(/^[\-\*]\s*/, '');
}

/**
 * Generates a clean vector PDF document directly to file download.
 * Prominent 20pt document title, strict word-wrapping inside margin bounds, guaranteed single-space 
 * padding around links, section heading treatment for 'Sources:', and native vector table grid rendering.
 */
export function downloadPDF(filename: string, content: string): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50; // Clean 50pt margins
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = margin + 10;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 10;
    }
  };

  const renderWrappedBlock = (
    text: string,
    fontSize: number,
    fontStyle: 'normal' | 'bold' | 'italic',
    textColor: [number, number, number],
    lineSpacing: number,
    indent: number = 0
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...textColor);

    const availableWidth = maxLineWidth - indent;
    const lines = doc.splitTextToSize(text, availableWidth);

    for (let i = 0; i < lines.length; i++) {
      checkPageBreak(lineSpacing);
      doc.text(lines[i], margin + indent, cursorY);
      cursorY += lineSpacing;
    }
  };

  const renderLineWithLinks = (rawLine: string, indent: number = 0) => {
    // Ensure space before [ and after ](url) if adjacent to text
    const formattedLine = rawLine
      .replace(/([^\s\(\[\{])(\[[^\]]+\]\([^)]+\))/g, '$1 $2')
      .replace(/(\[[^\]]+\]\([^)]+\))([^\s\.\,\;\:\!\?\)\}\]])/g, '$1 $2');

    // Matches [label](url) OR standalone http:// or https:// URLs
    const combinedRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    let match;
    let lastIndex = 0;
    const tokens: { text: string; link?: string }[] = [];

    while ((match = combinedRegex.exec(formattedLine)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ text: cleanMarkdownSegment(formattedLine.substring(lastIndex, match.index)) });
      }
      if (match[1] && match[2]) {
        tokens.push({ text: cleanMarkdownSegment(match[1]), link: match[2] });
      } else if (match[3]) {
        tokens.push({ text: match[3], link: match[3] });
      }
      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < formattedLine.length) {
      tokens.push({ text: cleanMarkdownSegment(formattedLine.substring(lastIndex)) });
    }

    if (tokens.length === 0) {
      tokens.push({ text: cleanMarkdownSegment(formattedLine) });
    }

    let currentX = margin + indent;
    checkPageBreak(15);

    const spaceWidth = doc.getTextWidth(' ') || 3.5;

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      const isLink = !!token.link;
      const url = token.link;
      const text = token.text;

      if (isLink) {
        doc.setTextColor(37, 99, 235); // Crisp blue for ALL links
        doc.setFont('helvetica', 'normal');
      } else {
        doc.setTextColor(51, 65, 85); // zinc-700
        doc.setFont('helvetica', 'normal');
      }

      // Split into words while keeping spaces
      const words = text.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;

        if (/^\s+$/.test(word)) {
          currentX += spaceWidth * word.length;
          if (currentX > margin + maxLineWidth) {
            cursorY += 15;
            currentX = margin + indent;
            checkPageBreak(15);
          }
          continue;
        }

        const wordWidth = doc.getTextWidth(word);

        if (currentX + wordWidth > margin + maxLineWidth) {
          cursorY += 15;
          currentX = margin + indent;
          checkPageBreak(15);
        }

        if (isLink && url) {
          doc.textWithLink(word, currentX, cursorY, { url });
        } else {
          doc.text(word, currentX, cursorY);
        }
        currentX += wordWidth;
      }
    }
    cursorY += 15;
  };

  const rawLines = content.split('\n');
  let inCodeBlock = false;
  let isFirstHeadingProcessed = false;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trimEnd();

    // Code blocks (``` ...)
    if (rawLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      cursorY += 4;
      continue;
    }

    if (inCodeBlock) {
      checkPageBreak(15);
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, cursorY - 10, maxLineWidth, 15, 'F');
      doc.setFont('courier', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      
      const wrapped = doc.splitTextToSize(rawLine, maxLineWidth - 16);
      for (let j = 0; j < wrapped.length; j++) {
        checkPageBreak(13);
        doc.text(wrapped[j], margin + 8, cursorY);
        cursorY += 13;
      }
      continue;
    }

    if (!rawLine.trim()) {
      cursorY += 6;
      continue;
    }

    // Markdown Table Detection & Vector Renderer
    if (rawLine.trim().startsWith('|') && rawLine.includes('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      i--; // Adjust loop index

      if (tableLines.length > 0) {
        const parsedRows: string[][] = [];
        for (const line of tableLines) {
          // Skip markdown table delimiter rows like | --- | --- |
          if (/^\|[\s\-:\s|]+\|$/.test(line)) continue;
          
          const cells = line
            .split('|')
            .map(c => cleanMarkdownSegment(c).trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

          if (cells.length > 0) {
            parsedRows.push(cells);
          }
        }

        if (parsedRows.length > 0) {
          const numCols = Math.max(...parsedRows.map(r => r.length));
          const colWidth = maxLineWidth / numCols;
          const cellPadding = 6;
          const cellTextWidth = colWidth - cellPadding * 2;

          cursorY += 8;

          for (let r = 0; r < parsedRows.length; r++) {
            const row = parsedRows[r];
            const isHeader = (r === 0);

            let maxCellLines = 1;
            const cellWrappedLines: string[][] = [];

            doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
            doc.setFontSize(isHeader ? 9 : 8.5);

            for (let c = 0; c < numCols; c++) {
              const cellText = row[c] || '';
              const wrapped = doc.splitTextToSize(cellText, cellTextWidth);
              cellWrappedLines.push(wrapped);
              if (wrapped.length > maxCellLines) {
                maxCellLines = wrapped.length;
              }
            }

            const rowHeight = maxCellLines * 12 + cellPadding * 2;
            checkPageBreak(rowHeight);

            // Draw cell header/row background fill
            if (isHeader) {
              doc.setFillColor(241, 245, 249); // slate-100 header fill
              doc.rect(margin, cursorY, maxLineWidth, rowHeight, 'F');
            } else if (r % 2 === 1) {
              doc.setFillColor(248, 250, 252); // alternate row fill
              doc.rect(margin, cursorY, maxLineWidth, rowHeight, 'F');
            }

            // Draw grid borders and render cell text
            doc.setDrawColor(226, 232, 240); // slate-200 border line
            doc.setLineWidth(0.75);

            for (let c = 0; c < numCols; c++) {
              const cellX = margin + c * colWidth;
              doc.rect(cellX, cursorY, colWidth, rowHeight, 'S');

              const lines = cellWrappedLines[c];
              doc.setTextColor(isHeader ? 15 : 51, isHeader ? 23 : 65, isHeader ? 42 : 85);
              
              for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                const textY = cursorY + cellPadding + 9 + lineIdx * 12;
                doc.text(lines[lineIdx], cellX + cellPadding, textY);
              }
            }

            cursorY += rowHeight;
          }

          cursorY += 10;
          continue;
        }
      }
    }

    // Detect 'Sources:' or 'Sources Cited:' or 'References:' as a section heading
    const isSourcesHeader = /^(#+\s*)?(\*\*)?(sources|sources cited|references):?(\*\*)?$/i.test(rawLine.trim());

    if (isSourcesHeader) {
      checkPageBreak(28);
      cursorY += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Sources Cited:', margin, cursorY);
      cursorY += 18;
      continue;
    }

    // Heading Matching (# ..., ## ..., ### ...)
    const isHeading1 = /^#\s+/.test(rawLine);
    const isHeading2 = /^##\s+/.test(rawLine);
    const isHeading3 = /^###+\s+/.test(rawLine);
    const isHeading = isHeading1 || isHeading2 || isHeading3;

    if (isHeading) {
      const text = cleanMarkdownSegment(rawLine).trim();
      if (!isFirstHeadingProcessed) {
        // Document Top Title Heading (Noticeably larger: 20pt)
        checkPageBreak(36);
        cursorY += 6;
        renderWrappedBlock(text, 20, 'bold', [15, 23, 42], 26);
        cursorY += 10;
        isFirstHeadingProcessed = true;
      } else if (isHeading1) {
        checkPageBreak(30);
        cursorY += 8;
        renderWrappedBlock(text, 15, 'bold', [15, 23, 42], 21);
        cursorY += 4;
      } else if (isHeading2) {
        checkPageBreak(26);
        cursorY += 6;
        renderWrappedBlock(text, 13, 'bold', [30, 41, 59], 18);
        cursorY += 3;
      } else {
        checkPageBreak(22);
        cursorY += 4;
        renderWrappedBlock(text, 11, 'bold', [51, 65, 85], 16);
        cursorY += 2;
      }
      continue;
    }

    // Blockquote (> ...)
    if (/^>\s+/.test(rawLine)) {
      const text = cleanMarkdownSegment(rawLine).trim();
      renderWrappedBlock(text, 9.5, 'italic', [71, 85, 105], 14, 14);
      continue;
    }

    // Bullet items (- ... or * ...)
    if (/^[\-\*]\s+/.test(rawLine)) {
      const plainContent = rawLine.replace(/^[\-\*]\s+/, '');
      checkPageBreak(15);
      doc.setFillColor(99, 102, 241);
      doc.circle(margin + 4, cursorY - 3, 2, 'F');
      renderLineWithLinks(plainContent, 14);
      continue;
    }

    // Standard Paragraph
    if (!isFirstHeadingProcessed && i === 0 && rawLine.length < 90) {
      // If no # markdown tag was present on the first line, treat first short line as Document Title
      checkPageBreak(36);
      renderWrappedBlock(cleanMarkdownSegment(rawLine).trim(), 20, 'bold', [15, 23, 42], 26);
      cursorY += 10;
      isFirstHeadingProcessed = true;
    } else {
      renderLineWithLinks(rawLine, 0);
    }
  }

  // Footer Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  const formattedName = filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  doc.save(`${formattedName || 'research-report'}.pdf`);
}
