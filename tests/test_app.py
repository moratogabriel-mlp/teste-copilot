import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory DB before each test
    for activity in activities.values():
        if isinstance(activity.get("participants"), list):
            activity["participants"] = activity["participants"][:2]  # keep only the original two


def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"], dict)
    assert "participants" in data["Chess Club"]


def test_signup_for_activity():
    email = "testuser@mergington.edu"
    activity = "Chess Club"
    # Ensure not already signed up
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert email in activities[activity]["participants"]


def test_signup_duplicate():
    email = "michael@mergington.edu"
    activity = "Chess Club"
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_nonexistent_activity():
    response = client.post("/activities/Nonexistent/signup?email=someone@mergington.edu")
    assert response.status_code == 404


def test_remove_participant():
    activity = "Chess Club"
    email = "daniel@mergington.edu"
    # Ensure present
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)
    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 204
    assert email not in activities[activity]["participants"]


def test_remove_nonexistent_participant():
    activity = "Chess Club"
    email = "notfound@mergington.edu"
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)
    response = client.delete(f"/activities/{activity}/participants/{email}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"


def test_remove_nonexistent_activity():
    response = client.delete("/activities/Nonexistent/participants/someone@mergington.edu")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
