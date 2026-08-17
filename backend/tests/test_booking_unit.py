from datetime import timezone

import pytest

from evolution_service import extract_qr, normalize_connection_state
from reservation_service import booking_settings, local_to_utc, maps_link, normalize_phone


def test_brazilian_phone_uses_default_ddi():
    assert normalize_phone("55", "(11) 99999-9999") == ("55", "11999999999", "5511999999999")


def test_international_phone_keeps_selected_ddi():
    assert normalize_phone("351", "912 345 678")[2] == "351912345678"


def test_invalid_phone_is_rejected():
    with pytest.raises(ValueError):
        normalize_phone("55", "123")


def test_restaurant_timezone_is_converted_to_utc():
    value = local_to_utc("2026-08-20", "19:30", "America/Sao_Paulo")
    assert value.tzinfo == timezone.utc
    assert value.hour == 22


def test_booking_defaults_are_merged_without_losing_overrides():
    settings = booking_settings({"enabled": True, "max_reservations_per_slot": 9})
    assert settings["enabled"] is True
    assert settings["max_reservations_per_slot"] == 9
    assert settings["reminder_minutes"] == 30


def test_maps_link_supports_address_and_coordinates():
    assert "Rua+A%2C+10" in maps_link({"name": "Casa", "address": "Rua A, 10"})
    assert "-23.5%2C-46.6" in maps_link({"name": "Casa", "latitude": -23.5, "longitude": -46.6})


def test_evolution_response_normalization():
    assert normalize_connection_state("open") == "connected"
    assert normalize_connection_state("connecting") == "connecting"
    assert normalize_connection_state("close") == "disconnected"
    assert extract_qr({"qrcode": {"base64": "data:image/png;base64,abc"}}).endswith("abc")
