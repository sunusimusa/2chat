document.addEventListener("DOMContentLoaded", async () => {

    const toggle = document.getElementById("notificationsToggle");
    const message = document.getElementById("settingsMessage");

    const token = localStorage.getItem("token");

    if (!token) {
        message.textContent = "Please log in to manage notification settings.";
        return;
    }

    async function loadSettings() {
        try {
            const response = await fetch("/api/notifications/settings", {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to load settings.");
            }

            toggle.checked = data.notificationsEnabled !== false;
            toggle.disabled = false;

            message.textContent = "Notification settings loaded.";

        } catch (error) {
            message.textContent = error.message;
        }
    }

    toggle.addEventListener("change", async () => {

        toggle.disabled = true;
        message.textContent = "Saving settings...";

        try {
            const response = await fetch("/api/notifications/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    enabled: toggle.checked
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to save settings.");
            }

            toggle.checked = data.notificationsEnabled;
            message.textContent = data.message;

        } catch (error) {
            toggle.checked = !toggle.checked;
            message.textContent = error.message;

        } finally {
            toggle.disabled = false;
        }
    });

    await loadSettings();

});
              
