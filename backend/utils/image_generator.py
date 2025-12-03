"""
Certificate Image Generator.

Produces shareable PNG previews for certificates so the frontend can
display lightweight thumbnails without re-rendering PDFs.
"""
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import Optional

from PIL import Image, ImageDraw, ImageFont
import qrcode


class CertificateImageGenerator:
    """Simple image renderer for certificate previews."""

    WIDTH = 1600
    HEIGHT = 900
    BG_COLOR = "#0A0A0F"
    ACCENT = "#00D4FF"
    TEXT_PRIMARY = "#FFFFFF"
    TEXT_SECONDARY = "#A1A1AA"
    CARD_BG = "#18181B"

    def __init__(self) -> None:
        self.title_font = self._load_font(size=64, bold=True)
        self.subtitle_font = self._load_font(size=32)
        self.body_font = self._load_font(size=28)
        self.small_font = self._load_font(size=22)

    def generate_certificate_image(
        self,
        agent_name: str,
        model: str,
        mode: str,
        test_type: str,
        asset: str,
        pnl_pct: Decimal,
        win_rate: Decimal,
        total_trades: int,
        max_drawdown_pct: Optional[Decimal],
        sharpe_ratio: Optional[Decimal],
        duration_display: str,
        test_period: str,
        verification_code: str,
        share_url: str,
        issued_at: datetime,
    ) -> bytes:
        """Render certificate data into a PNG image."""
        image = Image.new("RGB", (self.WIDTH, self.HEIGHT), self.BG_COLOR)
        draw = ImageDraw.Draw(image)

        self._draw_header(draw, agent_name)
        self._draw_subheader(draw, model, mode)
        self._draw_metrics_card(
            draw,
            test_type,
            asset,
            pnl_pct,
            win_rate,
            total_trades,
            max_drawdown_pct,
            sharpe_ratio,
            duration_display,
            test_period,
        )
        self._draw_footer(draw, verification_code, issued_at)
        self._paste_qr(image, share_url)

        buffer = BytesIO()
        image.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer.getvalue()

    def _draw_header(self, draw: ImageDraw.ImageDraw, agent_name: str) -> None:
        draw.text(
            (self.WIDTH / 2, 120),
            "AlphaLab Performance Certificate",
            font=self.subtitle_font,
            fill=self.ACCENT,
            anchor="mm",
        )
        draw.text(
            (self.WIDTH / 2, 220),
            agent_name,
            font=self.title_font,
            fill=self.TEXT_PRIMARY,
            anchor="mm",
        )

    def _draw_subheader(self, draw: ImageDraw.ImageDraw, model: str, mode: str) -> None:
        sub_text = f"{model} • {mode.upper()} MODE"
        draw.text(
            (self.WIDTH / 2, 300),
            sub_text,
            font=self.body_font,
            fill=self.TEXT_SECONDARY,
            anchor="mm",
        )

    def _draw_metrics_card(
        self,
        draw: ImageDraw.ImageDraw,
        test_type: str,
        asset: str,
        pnl_pct: Decimal,
        win_rate: Decimal,
        total_trades: int,
        max_drawdown_pct: Optional[Decimal],
        sharpe_ratio: Optional[Decimal],
        duration_display: str,
        test_period: str,
    ) -> None:
        card_left = 140
        card_top = 360
        card_right = self.WIDTH - 140
        card_bottom = card_top + 360

        draw.rounded_rectangle(
            (card_left, card_top, card_right, card_bottom), radius=32, fill=self.CARD_BG
        )

        draw.text(
            (card_left + 40, card_top + 40),
            f"{test_type.capitalize()} • {asset}",
            font=self.body_font,
            fill=self.TEXT_SECONDARY,
        )
        draw.text(
            (card_left + 40, card_top + 90),
            f"Period: {test_period}",
            font=self.small_font,
            fill=self.TEXT_SECONDARY,
        )

        metrics = [
            ("Total PnL", f"{pnl_pct:+.2f}%", self._pnl_color(pnl_pct)),
            ("Win Rate", f"{win_rate:.2f}%", self.TEXT_PRIMARY),
            ("Total Trades", str(total_trades), self.TEXT_PRIMARY),
            ("Duration", duration_display, self.TEXT_PRIMARY),
            (
                "Max Drawdown",
                f"{max_drawdown_pct:.2f}%" if max_drawdown_pct is not None else "N/A",
                self.TEXT_PRIMARY,
            ),
            (
                "Sharpe Ratio",
                f"{sharpe_ratio:.3f}" if sharpe_ratio is not None else "N/A",
                self.TEXT_PRIMARY,
            ),
        ]

        start_x = card_left + 40
        start_y = card_top + 150
        column_width = (card_right - card_left - 80) / 2
        row_height = 80

        for idx, (label, value, color) in enumerate(metrics):
            col = idx % 2
            row = idx // 2
            x = start_x + col * column_width
            y = start_y + row * row_height
            draw.text((x, y), label.upper(), font=self.small_font, fill=self.TEXT_SECONDARY)
            draw.text((x, y + 30), value, font=self.body_font, fill=color)

    def _draw_footer(
        self,
        draw: ImageDraw.ImageDraw,
        verification_code: str,
        issued_at: datetime,
    ) -> None:
        footer_y = self.HEIGHT - 150
        draw.text(
            (160, footer_y),
            f"Issued {issued_at.strftime('%B %d, %Y')}",
            font=self.small_font,
            fill=self.TEXT_SECONDARY,
        )
        draw.text(
            (160, footer_y + 40),
            f"Verification Code: {verification_code}",
            font=self.body_font,
            fill=self.ACCENT,
        )

    def _paste_qr(self, image: Image.Image, share_url: str) -> None:
        qr_img = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr_img.add_data(share_url)
        qr_img.make(fit=True)
        qr = qr_img.make_image(fill_color=self.ACCENT, back_color=self.BG_COLOR).convert("RGB")
        qr = qr.resize((220, 220))

        x = self.WIDTH - 220 - 120
        y = self.HEIGHT - 220 - 80
        image.paste(qr, (x, y))

    def _load_font(self, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
        """
        Attempt to load a truetype font, falling back to the default bitmap font.
        """
        font_candidates = [
            "arialbd.ttf" if bold else "arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ]
        for path in font_candidates:
            if not path:
                continue
            try:
                return ImageFont.truetype(path, size=size)
            except (OSError, IOError):
                continue
        return ImageFont.load_default()

    def _pnl_color(self, pnl_pct: Decimal) -> str:
        return "#10B981" if pnl_pct >= 0 else "#EF4444"

