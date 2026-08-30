window.BOAT_FORM_ENDPOINT = window.BOAT_FORM_ENDPOINT || "";

(() => {
  const header = document.querySelector(".topbar");
  const desktopNav = header?.querySelector("nav");
  if (header && desktopNav) {
    const button = document.createElement("button");
    button.className = "mobile-menu-button";
    button.type = "button";
    button.setAttribute("aria-label", "Open navigation");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "☰";
    header.appendChild(button);

    const menu = document.createElement("nav");
    menu.className = "mobile-menu";
    menu.setAttribute("aria-label", "Mobile navigation");
    menu.innerHTML = desktopNav.innerHTML;
    document.body.appendChild(menu);

    const closeMenu = () => {
      menu.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      button.textContent = "☰";
    };
    button.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "×" : "☰";
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMenu(); });
  }

  const entry = 15000;
  const kitty = 200;
  const money = value => "~$" + Math.round(value).toLocaleString("en-AU");
  const peopleButtons = [...document.querySelectorAll("[data-people]")];
  peopleButtons.forEach(button => button.addEventListener("click", () => {
    peopleButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const people = Number(button.dataset.people);
    document.getElementById("upfront").textContent = money(entry / people);
    document.getElementById("monthly").textContent = money(kitty / people);
  }));

  const form = document.getElementById("interestForm");
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById("formStatus");
  const setStatus = (message, type = "") => {
    status.textContent = message;
    status.className = `form-status ${type}`.trim();
  };

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.elements.website.value) return;

    const data = Object.fromEntries(new FormData(form).entries());
    const submissionKey = `${data.email.toLowerCase()}|${data.mobile.replace(/\D/g, "")}`;
    const lastSubmission = JSON.parse(localStorage.getItem("boatFormLastSubmission") || "null");
    if (lastSubmission?.key === submissionKey && Date.now() - lastSubmission.time < 60000) {
      setStatus("That enquiry was already sent. Sam will be in touch shortly.", "success");
      return;
    }

    const payload = {
      ...data,
      submittedAt: new Date().toISOString(),
      page: window.location.href,
      referrer: document.referrer,
      utmSource: new URLSearchParams(window.location.search).get("utm_source") || "",
      submissionId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    };

    button.disabled = true;
    button.textContent = "Sending…";
    setStatus("Sending your enquiry…");

    try {
      if (!window.BOAT_FORM_ENDPOINT) {
        const body = [
          "Hi Sam, I am interested in the Gold Coast Boat Syndicate.",
          "",
          `Name: ${data.name}`,
          `Mobile: ${data.mobile}`,
          `Email: ${data.email}`,
          `People in share: ${data.groupMembers || "Not provided"}`,
          `Group size: ${data.groupSize || "Not provided"}`,
          `Boat experience: ${data.boatExperience || "Not provided"}`,
          `Questions: ${data.notes || "None"}`,
        ].join("\n");
        window.location.href = `mailto:sam@newwavedm.com?subject=${encodeURIComponent(`Boat Syndicate enquiry – ${data.name}`)}&body=${encodeURIComponent(body)}`;
        setStatus("Your email app has opened with the enquiry ready to send.", "success");
        return;
      }

      await fetch(window.BOAT_FORM_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("boatFormLastSubmission", JSON.stringify({ key: submissionKey, time: Date.now() }));
      form.reset();
      setStatus("Thanks! Your interest has been registered and Sam will be in touch shortly.", "success");
    } catch (error) {
      setStatus("Something went wrong. Please try again or email sam@newwavedm.com.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "Register My Interest";
    }
  });
})();
