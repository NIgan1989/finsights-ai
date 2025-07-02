import React from 'react';
import { pdf, Document } from '@react-pdf/renderer';
import { FinancialReport } from '../types';
import { FinancialReportContent } from '../components/FinancialReportPDF';

export const generatePdf = async (
  reportData: FinancialReport
): Promise<void> => {
  try {
    const dateRange = {
      start: reportData.dateRange?.start || new Date().toISOString().split('T')[0],
      end: reportData.dateRange?.end || new Date().toISOString().split('T')[0]
    };

    const blob = await pdf(
      <Document>
        <FinancialReportContent report={reportData} dateRange={dateRange} />
      </Document>
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinSights-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка при генерации PDF:', error);
    throw error; // Перебрасываем ошибку для обработки в вызывающем коде
  }
};
