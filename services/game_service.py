import random

class PinballReboundsEngine:
    DIRECTIONS = {
        "UP": (-1, 0),
        "DOWN": (1, 0),
        "LEFT": (0, -1),
        "RIGHT": (0, 1)
    }

    # Direction transformations after striking a mirror:
    SLASH_REFLECTIONS = {
        # '/' mirror
        "RIGHT": "UP",
        "UP": "RIGHT",
        "DOWN": "LEFT",
        "LEFT": "DOWN"
    }

    BACKSLASH_REFLECTIONS = {
        # '\' mirror
        "RIGHT": "DOWN",
        "DOWN": "RIGHT",
        "UP": "LEFT",
        "LEFT": "UP"
    }

    @classmethod
    def trace_laser(cls, rows: int, cols: int, reflectors: dict, start_entry: dict) -> dict:
        """
        Traces laser trajectory through grid.
        start_entry: e.g. {"side": "LEFT", "index": 2} (enters (row=2, col=0) moving RIGHT)
        reflectors: dict mapping "(row,col)" to '/' or '\\'
        """
        side = start_entry.get("side")
        idx = start_entry.get("index")

        if side == "LEFT":
            r, c = idx, 0
            direction = "RIGHT"
        elif side == "RIGHT":
            r, c = idx, cols - 1
            direction = "LEFT"
        elif side == "TOP":
            r, c = 0, idx
            direction = "DOWN"
        elif side == "BOTTOM":
            r, c = rows - 1, idx
            direction = "UP"
        elif side == "INTERNAL":
            r = start_entry.get("row", 0)
            c = start_entry.get("col", 0)
            direction = start_entry.get("direction", "RIGHT")
        else:
            raise ValueError(f"Unknown side: {side}")

        visited = set()
        path = []
        reflections = []
        is_loop = False
        steps = 0
        max_steps = rows * cols * 4

        while True:
            # Check bounds: if outside grid, laser has exited!
            if r < 0:
                exit_entry = {"side": "TOP", "index": c, "label": f"T{c}"}
                break
            elif r >= rows:
                exit_entry = {"side": "BOTTOM", "index": c, "label": f"B{c}"}
                break
            elif c < 0:
                exit_entry = {"side": "LEFT", "index": r, "label": f"L{r}"}
                break
            elif c >= cols:
                exit_entry = {"side": "RIGHT", "index": r, "label": f"R{r}"}
                break

            state = (r, c, direction)
            if state in visited or steps > max_steps:
                is_loop = True
                exit_entry = {"side": "LOOP", "index": -1, "label": "LOOP"}
                break
            visited.add(state)

            cell_key = f"{r},{c}"
            mirror = reflectors.get(cell_key)
            out_direction = direction

            if mirror == "/":
                out_direction = cls.SLASH_REFLECTIONS[direction]
                reflections.append({"row": r, "col": c, "mirror": "/", "entry_dir": direction, "new_dir": out_direction})
            elif mirror == "\\":
                out_direction = cls.BACKSLASH_REFLECTIONS[direction]
                reflections.append({"row": r, "col": c, "mirror": "\\", "entry_dir": direction, "new_dir": out_direction})

            path.append({
                "row": r,
                "col": c,
                "entry_dir": direction,
                "exit_dir": out_direction,
                "mirror": mirror,
                "has_mirror": mirror is not None
            })

            direction = out_direction
            dr, dc = cls.DIRECTIONS[direction]
            r += dr
            c += dc
            steps += 1

        return {
            "success": not is_loop,
            "is_loop": is_loop,
            "path": path,
            "steps": steps,
            "reflections_count": len(reflections),
            "reflections": reflections,
            "exit_point": exit_entry,
            "start_entry": start_entry
        }

    @classmethod
    def generate_puzzle(cls, rows: int = 4, cols: int = 4, difficulty: str = "Medium", seed: int = None) -> dict:
        rng = random.Random(seed) if seed is not None else random.Random()
        
        diff_config = {
            "Easy": {"num_mirrors": (3, 4), "min_reflections": 1},
            "Medium": {"num_mirrors": (4, 6), "min_reflections": 2},
            "Hard": {"num_mirrors": (6, 8), "min_reflections": 3}
        }
        cfg = diff_config.get(difficulty, diff_config["Medium"])

        attempts = 0
        while attempts < 300:
            attempts += 1
            num_mirrors = rng.randint(*cfg["num_mirrors"])
            reflectors = {}
            all_coords = [(r, c) for r in range(rows) for c in range(cols)]
            mirror_cells = rng.sample(all_coords, num_mirrors)
            for r, c in mirror_cells:
                reflectors[f"{r},{c}"] = rng.choice(["/", "\\"])

            # Pick random start border
            side = rng.choice(["LEFT", "RIGHT", "TOP", "BOTTOM"])
            index = rng.randint(0, (rows if side in ["LEFT", "RIGHT"] else cols) - 1)
            start_entry = {"side": side, "index": index, "label": f"{side[0]}{index}"}

            result = cls.trace_laser(rows, cols, reflectors, start_entry)

            if not result["is_loop"] and result["reflections_count"] >= cfg["min_reflections"]:
                correct_label = result["exit_point"]["label"]
                
                # All possible border labels
                all_borders = [f"T{c}" for c in range(cols)] + \
                              [f"B{c}" for c in range(cols)] + \
                              [f"L{r}" for r in range(rows)] + \
                              [f"R{r}" for r in range(rows)]
                
                # Exclude start label and correct label to pick distractors
                start_label = start_entry["label"]
                distractors = [b for b in all_borders if b != correct_label and b != start_label]
                choices = [correct_label] + rng.sample(distractors, min(3, len(distractors)))
                rng.shuffle(choices)

                return {
                    "rows": rows,
                    "cols": cols,
                    "difficulty": difficulty,
                    "reflectors": reflectors,
                    "start_entry": start_entry,
                    "exit_point": result["exit_point"],
                    "correct_label": correct_label,
                    "choices": choices,
                    "path": result["path"],
                    "reflections_count": result["reflections_count"]
                }

        # Safe fallback deterministic 4x4 puzzle
        fixed_reflectors = {
            "0,1": "/",
            "1,1": "\\",
            "1,3": "/",
            "2,3": "\\"
        }
        start = {"side": "LEFT", "index": 1, "label": "L1"}
        result = cls.trace_laser(rows, cols, fixed_reflectors, start)
        return {
            "rows": rows,
            "cols": cols,
            "difficulty": difficulty,
            "reflectors": fixed_reflectors,
            "start_entry": start,
            "exit_point": result["exit_point"],
            "correct_label": result["exit_point"]["label"],
            "choices": ["T1", "B3", "R2", result["exit_point"]["label"]],
            "path": result["path"],
            "reflections_count": result["reflections_count"]
        }
