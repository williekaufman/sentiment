from flask import Flask, jsonify, request, make_response, render_template
from flask_cors import CORS, cross_origin
from settings import LOCAL, PASSWORD
from redis_utils import rget, rset 
from secrets import compare_digest
from prompt import query 

from enum import Enum

app = Flask(__name__)
CORS(app)

@app.route("/", methods=['GET'])
def index():
    return render_template('index.html')

@app.route("/query", methods=['GET'])
@cross_origin()
def new_game():
    word = request.args.get('word')
    password = request.args.get('password')
    if not password or not compare_digest(password, PASSWORD):
        return {'success': False, 'message': 'Incorrect password'}
    if not word:
        return {'success': False, 'message': 'Must provide word'}
    answer = query(word)
    return {'success': True, 'word': word, 'answer': answer, 'mean': sum([k * v for k, v in answer.items()]) / sum(answer.values())}

if __name__ == '__main__':
    print('app running!')
    app.run(host='0.0.0.0', port=5001 if LOCAL else 5004)