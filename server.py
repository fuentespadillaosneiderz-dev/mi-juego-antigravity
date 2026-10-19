# Servidor Web y API de Puntuaciones en Python (Entorno Virtual)
import os
import sqlite3
from flask import Flask, send_from_directory, jsonify, request

app = Flask(__name__, static_folder='.', static_url_path='')
DB_PATH = os.path.join(os.path.dirname(__file__), 'leaderboard.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            score INTEGER NOT NULL,
            kills INTEGER DEFAULT 0,
            max_combo INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Servir index.html en la raíz
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Servir archivos estáticos (style.css, src/*, etc.)
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# API: Obtener las 10 mejores puntuaciones
@app.route('/api/scores', methods=['GET'])
def get_scores():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT player_name, score, kills, max_combo, created_at 
            FROM scores 
            ORDER BY score DESC 
            LIMIT 10
        ''')
        rows = cursor.fetchall()
        conn.close()

        results = [
            {
                "player_name": r[0],
                "score": r[1],
                "kills": r[2],
                "max_combo": r[3],
                "created_at": r[4]
            }
            for r in rows
        ]
        return jsonify({"success": True, "scores": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# API: Guardar nueva puntuación
@app.route('/api/scores', methods=['POST'])
def save_score():
    try:
        data = request.get_json() or {}
        name = data.get('player_name', 'Pistolero Espectral')[:20]
        score = int(data.get('score', 0))
        kills = int(data.get('kills', 0))
        max_combo = int(data.get('max_combo', 0))

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO scores (player_name, score, kills, max_combo)
            VALUES (?, ?, ?, ?)
        ''', (name, score, kills, max_combo))
        conn.commit()
        conn.close()

        return jsonify({"success": True, "message": "Puntuación guardada con éxito"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"===========================================================")
    print(f"  EL VENGADOR DEL DESIERTO: LA FURIA DE LOS 3 OJOS")
    print(f"  Servidor activo en: http://localhost:{port}/")
    print(f"  Base de datos SQLite: {DB_PATH}")
    print(f"===========================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
