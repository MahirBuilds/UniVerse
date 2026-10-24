import pytest
from services.leaderboard_service import LeaderboardService

def test_leaderboard_ordering():
    service = LeaderboardService()
    board = service.get_leaderboard("This Week")
    assert len(board) > 0
    # First place should have highest points
    assert board[0]['rank'] == 1
    assert board[0]['points'] >= board[1]['points']

    # Current user Mahir Limbani should exist in the leaderboard
    user_entry = next((e for e in board if e['is_current_user']), None)
    assert user_entry is not None
    assert user_entry['name'] == 'Mahir Limbani'
    assert user_entry['points'] == 1240
    assert user_entry['rank'] == 5
