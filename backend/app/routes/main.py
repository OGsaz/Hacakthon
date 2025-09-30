from flask import Blueprint, request, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/api/query', methods=['POST'])
def query():
    data = request.get_json() or {}
    question = data.get('question')
    if not question:
        return jsonify({'error': 'No question provided'}), 400

    # Simulate AI response (replace with real API integration)
    answer = f"This is a demo answer for your question: \"{question}\""

    return jsonify({'answer': answer})
