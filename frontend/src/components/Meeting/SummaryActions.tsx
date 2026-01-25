import jsPDF from 'jspdf'

interface SummaryActionsProps {
  transcription: string
  summary: string
}

function SummaryActions({ transcription, summary }: SummaryActionsProps) {
  const handleCopy = () => {
    const text = `TRANSCRIPTION:\n\n${transcription}\n\n\nCOMPTE RENDU:\n\n${summary}`
    navigator.clipboard.writeText(text).then(() => {
      alert('Copié dans le presse-papiers !')
    })
  }

  const handleExportTxt = () => {
    const content = `TRANSCRIPTION:\n\n${transcription}\n\n\nCOMPTE RENDU:\n\n${summary}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compte-rendu.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPdf = () => {
    const doc = new jsPDF()
    
    // Configuration
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPosition = margin
    
    // Fonction pour ajouter une nouvelle page si nécessaire
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
    }
    
    // Titre principal
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Compte Rendu de Réunion', margin, yPosition)
    yPosition += 10
    
    // Ligne de séparation
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
    
    // Section Transcription
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('TRANSCRIPTION', margin, yPosition)
    yPosition += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const transcriptionLines = doc.splitTextToSize(transcription, maxWidth)
    checkPageBreak(transcriptionLines.length * 5 + 10)
    
    transcriptionLines.forEach((line: string) => {
      checkPageBreak(5)
      doc.text(line, margin, yPosition)
      yPosition += 5
    })
    
    yPosition += 10
    checkPageBreak(15)
    
    // Section Compte Rendu
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPTE RENDU', margin, yPosition)
    yPosition += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const summaryLines = doc.splitTextToSize(summary, maxWidth)
    
    summaryLines.forEach((line: string) => {
      checkPageBreak(5)
      doc.text(line, margin, yPosition)
      yPosition += 5
    })
    
    // Sauvegarder le PDF
    doc.save('compte-rendu.pdf')
  }

  return (
    <div className="summary-actions">
      <button onClick={handleCopy} className="btn btn-secondary">
        Copier (transcription + CR)
      </button>
      <button onClick={handleExportPdf} className="btn btn-secondary">
        Exporter en PDF
      </button>
      <button onClick={handleExportTxt} className="btn btn-secondary">
        Exporter en .txt
      </button>
    </div>
  )
}

export default SummaryActions
