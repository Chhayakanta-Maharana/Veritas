"""
Veritas Sentinel — Forensic PDF Report Generator
Produces formal forensic inspection reports utilizing ReportLab.
"""

import os
import io
import base64
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.units import inch


def generate_forensic_pdf_report(analysis_data: Dict[str, Any], output_path: Optional[str] = None) -> bytes:
    """
    Generates a formal forensic laboratory report for deepfake / synthetic media detection.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer if output_path is None else output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Italic'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748b')
    )

    elements = []

    # 1. Header
    elements.append(Paragraph("DOOMSDAY SENTINEL — FORENSIC MEDIA AUDIT REPORT", title_style))
    elements.append(Paragraph("Future Tech FT-02: AI-Powered Deepfake & Synthetic Forensics Verification System", subtitle_style))
    elements.append(Spacer(1, 12))

    # 2. Executive Summary Box
    pred = analysis_data.get('prediction', 'UNKNOWN')
    score = analysis_data.get('score', 0.0)
    conf = analysis_data.get('confidence', score if pred == 'FAKE' else (1.0 - score))
    
    pred_color = colors.HexColor('#dc2626') if pred == 'FAKE' else colors.HexColor('#16a34a')

    summary_data = [
        [
            Paragraph(f"<b>ANALYSIS ID:</b><br/>{analysis_data.get('analysis_id', 'N/A')}", body_style),
            Paragraph(f"<b>STATUS:</b><br/>{analysis_data.get('status', 'COMPLETED').upper()}", body_style)
        ],
        [
            Paragraph(f"<b>PRIMARY FINDING:</b><br/><font color='{pred_color.hexval()}'><b>{pred}</b></font>", body_style),
            Paragraph(f"<b>CONFIDENCE LEVEL:</b><br/>{conf*100:.2f}% (Score: {score:.4f})", body_style)
        ],
        [
            Paragraph(f"<b>MEDIA TYPE:</b><br/>{analysis_data.get('media_type', 'image').upper()}", body_style),
            Paragraph(f"<b>VERIFIED THRESHOLD:</b><br/>{analysis_data.get('threshold', 0.50):.4f}", body_style)
        ],
        [
            Paragraph(f"<b>FORENSIC ENGINE:</b><br/>{analysis_data.get('model_version', 'v1.0')}", body_style),
            Paragraph(f"<b>PROCESSING DURATION:</b><br/>{analysis_data.get('processing_duration_ms', 0):.2f} ms", body_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[3.5*inch, 3.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # 3. Video Frame Breakdown if applicable
    frame_stats = analysis_data.get('frame_statistics')
    if frame_stats:
        elements.append(Paragraph("Video Temporal Forensic Telemetry", heading_style))
        vid_data = [
            ["Metric", "Value"],
            ["Total Video Frames", str(frame_stats.get('total_video_frames', 0))],
            ["Sampled Analysis Frames", str(frame_stats.get('processed_sample_frames', 0))],
            ["Detected Fake Frames", str(frame_stats.get('fake_frame_count', 0))],
            ["Detected Real Frames", str(frame_stats.get('real_frame_count', 0))],
            ["Video Duration (seconds)", f"{frame_stats.get('video_duration_sec', 0.0):.2f}s"]
        ]
        vid_table = Table(vid_data, colWidths=[3.5*inch, 3.5*inch])
        vid_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(vid_table)
        elements.append(Spacer(1, 14))

    # 4. Grad-CAM Explanation Image if available
    explanation_b64 = analysis_data.get('explanation_image')
    if explanation_b64 and ',' in explanation_b64:
        elements.append(Paragraph("Explainable AI: Neural Gradient Sensitivity (Grad-CAM)", heading_style))
        try:
            _, b64data = explanation_b64.split(',', 1)
            img_bytes = base64.b64decode(b64data)
            img_buf = io.BytesIO(img_bytes)
            rl_img = RLImage(img_buf, width=2.4*inch, height=2.4*inch)
            elements.append(rl_img)
            elements.append(Spacer(1, 10))
        except Exception as e:
            elements.append(Paragraph(f"<i>Could not render explanation image: {e}</i>", disclaimer_style))

    # 5. Limitations & Forensic Disclaimer
    elements.append(Paragraph("System Disclaimers & Operational Scope", heading_style))
    limitations = analysis_data.get('limitations', [])
    if not limitations:
        limitations = [
            "Machine-learning forensic predictions reflect probabilistic sensitivity to anomalous frequency patterns.",
            "Predictions should be evaluated alongside corroborating chain-of-custody metadata, not as standalone legal proof."
        ]
    for lim in limitations:
        elements.append(Paragraph(f"• {lim}", disclaimer_style))
        elements.append(Spacer(1, 2))

    elements.append(Spacer(1, 14))
    elements.append(Paragraph(
        "CONFIDENTIALITY NOTICE: This document contains algorithmic media forensic findings generated by Veritas Sentinel. "
        "Generated under Future Tech FT-02 Deepfake & Synthetic Media Forensics specification.",
        disclaimer_style
    ))

    doc.build(elements)
    
    if output_path is not None:
        with open(output_path, "rb") as f:
            return f.read()
    else:
        return buffer.getvalue()

