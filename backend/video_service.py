"""Otimização de MP4/MOV para reprodução progressiva ("faststart").

Um MP4 guarda o índice de reprodução no átomo `moov`. Quando os codificadores
gravam esse átomo depois do `mdat` (os dados de vídeo), o navegador precisa
baixar o arquivo inteiro antes de conseguir exibir o primeiro quadro — é o caso
clássico de vídeo que "não roda" ou demora muito para começar.

Mover o `moov` para o início resolve, mas os deslocamentos de chunk (`stco`/`co64`)
apontam para posições absolutas no arquivo e precisam ser corrigidos. É o que o
qt-faststart do ffmpeg faz; aqui a mesma operação é feita em memória, sem
dependência externa.
"""

import struct

CONTAINERS = {b"moov", b"trak", b"mdia", b"minf", b"stbl", b"edts", b"udta", b"mvex"}
UINT32_MAX = 0xFFFFFFFF

def iter_atoms(data, start, end):
    position = start
    while position + 8 <= end:
        size = struct.unpack_from(">I", data, position)[0]
        kind = bytes(data[position + 4:position + 8])
        header = 8
        if size == 1:
            if position + 16 > end:
                return
            size = struct.unpack_from(">Q", data, position + 8)[0]
            header = 16
        elif size == 0:
            size = end - position
        if size < header or position + size > end:
            return
        yield kind, position, size, header
        position += size

def _shift_offsets(buffer, start, end, delta):
    """Soma `delta` a cada offset de chunk. Retorna False se algum estourar 32 bits."""
    for kind, position, size, header in iter_atoms(buffer, start, end):
        if kind in CONTAINERS:
            if not _shift_offsets(buffer, position + header, position + size, delta):
                return False
            continue
        if kind not in {b"stco", b"co64"}:
            continue
        body = position + header + 4  # pula version/flags
        if body + 4 > position + size:
            return False
        count = struct.unpack_from(">I", buffer, body)[0]
        entries = body + 4
        width = 4 if kind == b"stco" else 8
        if entries + count * width > position + size:
            return False
        for index in range(count):
            at = entries + index * width
            if width == 4:
                value = struct.unpack_from(">I", buffer, at)[0] + delta
                if value > UINT32_MAX:
                    return False
                struct.pack_into(">I", buffer, at, value)
            else:
                struct.pack_into(">Q", buffer, at, struct.unpack_from(">Q", buffer, at)[0] + delta)
    return True

def needs_faststart(data: bytes) -> bool:
    positions = {}
    for kind, position, _, _ in iter_atoms(data, 0, len(data)):
        positions.setdefault(kind, position)
    return b"moov" in positions and b"mdat" in positions and positions[b"moov"] > positions[b"mdat"]

def faststart(data: bytes) -> bytes:
    """Devolve o arquivo com o `moov` antes do `mdat`. Em qualquer situação
    inesperada devolve o conteúdo original — nunca corrompe o upload."""
    try:
        atoms = list(iter_atoms(data, 0, len(data)))
        moov = next((atom for atom in atoms if atom[0] == b"moov"), None)
        mdat = next((atom for atom in atoms if atom[0] == b"mdat"), None)
        if not moov or not mdat or moov[1] < mdat[1]:
            return data

        moov_bytes = bytearray(data[moov[1]:moov[1] + moov[2]])
        if not _shift_offsets(moov_bytes, 0, len(moov_bytes), moov[2]):
            return data

        head = data[:mdat[1]]
        tail = data[mdat[1]:moov[1]] + data[moov[1] + moov[2]:]
        result = head + bytes(moov_bytes) + tail
        return result if len(result) == len(data) else data
    except Exception:
        return data
