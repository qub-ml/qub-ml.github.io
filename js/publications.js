(function () {
    const container = document.querySelector("[data-publications-src]");

    if (!container) {
        return;
    }

    const highlightAuthor = "Chen Feng";

    const escapeHtml = (value) => String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const renderAuthors = (authors) => {
        const safeAuthors = authors.map((author) => {
            const safeAuthor = escapeHtml(author);
            return author === highlightAuthor ? `<strong>${safeAuthor}</strong>` : safeAuthor;
        });

        if (safeAuthors.length <= 2) {
            return safeAuthors.join(" and ");
        }

        return `${safeAuthors.slice(0, -1).join(", ")}, and ${safeAuthors[safeAuthors.length - 1]}`;
    };

    const renderLinks = (links) => {
        if (!Array.isArray(links) || links.length === 0) {
            return "";
        }

        const linkItems = links.map((link) => (
            `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
        )).join("");

        return `<div class="pub-links">${linkItems}</div>`;
    };

    const renderPublications = (publications) => {
        const grouped = publications.reduce((groups, publication) => {
            if (!groups.has(publication.year)) {
                groups.set(publication.year, []);
            }

            groups.get(publication.year).push(publication);
            return groups;
        }, new Map());

        container.innerHTML = Array.from(grouped.entries()).map(([year, items]) => (
            `<h2 class="pub-year">${escapeHtml(year)}</h2>
            <div class="pub-list">
                ${items.map((publication) => (
                    `<article class="pub-item">
                        <div class="pub-title">${escapeHtml(publication.title)}</div>
                        <div class="pub-authors">${renderAuthors(publication.authors)}</div>
                        <div class="pub-venue">${escapeHtml(publication.venue)}</div>
                        ${publication.note ? `<div class="pub-note">${escapeHtml(publication.note)}</div>` : ""}
                        ${renderLinks(publication.links)}
                    </article>`
                )).join("")}
            </div>`
        )).join("");

        container.removeAttribute("aria-busy");
    };

    const renderStructuredData = (publications) => {
        const graph = publications.map((publication) => ({
            "@type": "ScholarlyArticle",
            "headline": publication.title,
            "author": publication.authors.map((author) => ({
                "@type": "Person",
                "name": author
            })),
            "isPartOf": {
                "@type": "CreativeWork",
                "name": publication.venue
            },
            "url": publication.links && publication.links[0] ? publication.links[0].url : "https://qub-ml.github.io/publications.html"
        }));

        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": graph
        });

        document.head.appendChild(script);
    };

    fetch(container.dataset.publicationsSrc)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Unable to load publications.");
            }

            return response.json();
        })
        .then((publications) => {
            renderPublications(publications);
            renderStructuredData(publications);
        })
        .catch(() => {
            container.innerHTML = '<p class="pub-empty">Publications are temporarily unavailable. Please visit Dr. Feng&#039;s personal website or ORCID for the full record.</p>';
            container.removeAttribute("aria-busy");
        });
})();
