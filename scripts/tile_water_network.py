import gzip
import json
from collections import OrderedDict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / 'source-data'
OUTPUT_DIR = ROOT / 'public' / 'data' / 'water-network'
REGION_BOUNDS = (174.0, -37.5, 176.0, -36.0)
GRID_DEGREES = 0.025
MAX_OPEN_TILES = 192


def coordinates_for(value):
    if (
        isinstance(value, list)
        and len(value) >= 2
        and isinstance(value[0], (int, float))
        and isinstance(value[1], (int, float))
    ):
        yield value[0], value[1]
    elif isinstance(value, list):
        for item in value:
            yield from coordinates_for(item)


def build_tiles(source_name, layer_name):
    source_path = SOURCE_DIR / source_name
    layer_dir = OUTPUT_DIR / layer_name
    layer_dir.mkdir(parents=True, exist_ok=True)
    for existing_tile in layer_dir.glob('*.geojsonl.gz'):
        existing_tile.unlink()

    west, south, east, north = REGION_BOUNDS
    west_tile = int(west // GRID_DEGREES)
    east_tile = int(east // GRID_DEGREES)
    south_tile = int(south // GRID_DEGREES)
    north_tile = int(north // GRID_DEGREES)
    writers = OrderedDict()
    tile_ids = set()
    source_count = 0
    selected_count = 0
    max_open = MAX_OPEN_TILES

    def get_writer(tile_id):
        if tile_id in writers:
            writer = writers.pop(tile_id)
            writers[tile_id] = writer
            return writer
        if len(writers) >= max_open:
            _, writer = writers.popitem(last=False)
            writer.close()
        tile_path = layer_dir / f'{tile_id}.geojsonl.gz'
        writer = gzip.open(tile_path, 'at', encoding='utf-8', compresslevel=6, newline='\n')
        writers[tile_id] = writer
        return writer

    try:
        with source_path.open('r', encoding='utf-8') as source:
            for line in source:
                record = line.strip().rstrip(',')
                if not record.startswith('{"type":"Feature"'):
                    continue
                source_count += 1
                feature = json.loads(record)
                geometry = feature.get('geometry') or {}
                coordinates = list(coordinates_for(geometry.get('coordinates')))
                if not coordinates:
                    continue

                longitudes = [point[0] for point in coordinates]
                latitudes = [point[1] for point in coordinates]
                if (
                    max(longitudes) < west
                    or min(longitudes) > east
                    or max(latitudes) < south
                    or min(latitudes) > north
                ):
                    continue

                selected_count += 1
                min_x = max(west_tile, int(min(longitudes) // GRID_DEGREES))
                max_x = min(east_tile, int(max(longitudes) // GRID_DEGREES))
                min_y = max(south_tile, int(min(latitudes) // GRID_DEGREES))
                max_y = min(north_tile, int(max(latitudes) // GRID_DEGREES))
                serialized = json.dumps(feature, separators=(',', ':'), ensure_ascii=False) + '\n'
                for tile_x in range(min_x, max_x + 1):
                    for tile_y in range(min_y, max_y + 1):
                        tile_id = f'{tile_x}_{tile_y}'
                        get_writer(tile_id).write(serialized)
                        tile_ids.add(tile_id)
    finally:
        for writer in writers.values():
            writer.close()

    tile_index = {'gridDegrees': GRID_DEGREES, 'tiles': sorted(tile_ids)}
    index_path = OUTPUT_DIR / f'{layer_name}-tiles.json'
    index_path.write_text(json.dumps(tile_index, separators=(',', ':')), encoding='utf-8')
    total_bytes = sum(tile.stat().st_size for tile in layer_dir.glob('*.geojsonl.gz'))
    print(
        f'{layer_name}: selected {selected_count:,} of {source_count:,} features; '
        f'{len(tile_ids):,} tiles, {total_bytes / 1024 / 1024:.2f} MB compressed'
    )


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_tiles('Water_Pipe.geojson', 'pipes')
    build_tiles('Water_Valve.geojson', 'valves')


if __name__ == '__main__':
    main()
