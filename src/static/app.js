document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML with delete icon
        const participantsItems = (details.participants && details.participants.length > 0)
          ? details.participants.map(p => `
              <li class="participant-item" data-email="${p}">
                <span class="participant-email">${p}</span>
                <button class="delete-participant-btn" title="Remove participant" data-activity="${name}" data-email="${p}">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8V15C6 15.55 6.45 16 7 16H13C13.55 16 14 15.55 14 15V8" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M9 11V13" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M11 11V13" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M4 6H16" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M8 6V5C8 4.45 8.45 4 9 4H11C11.55 4 12 4.45 12 5V6" stroke="#c62828" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </button>
              </li>
            `).join("")
          : `<li class="no-participants">No participants yet</li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <div class="participants-header">Participants <span class="count">(${details.participants.length})</span></div>
            <ul class="participants-list">
              ${participantsItems}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add event listeners for delete buttons
        const deleteBtns = activityCard.querySelectorAll('.delete-participant-btn');
        deleteBtns.forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const activity = btn.getAttribute('data-activity');
            const email = btn.getAttribute('data-email');
            if (!activity || !email) return;
            if (!confirm(`Remove ${email} from ${activity}?`)) return;
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchActivities(); // Refresh list
              } else {
                const result = await response.json();
                alert(result.detail || 'Failed to remove participant.');
              }
            } catch (error) {
              alert('Failed to remove participant.');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Atualiza a lista de atividades imediatamente
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
