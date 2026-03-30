import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

const API_BASE = "https://api.mercana.so";

function formatMoney(n) {
  if (n == null) return null;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

const STATE_ABBREV = {
  "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
  "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
  "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
  "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
  "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
  "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
  "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
  "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
  "district of columbia": "DC",
};

function abbreviateState(state) {
  if (!state) return null;
  if (state.length === 2) return state.toUpperCase();
  return STATE_ABBREV[state.toLowerCase()] || state;
}

function formatNumber(n) {
  if (n == null || n === 0) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatSignal(category) {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function socialUrl(platform, username) {
  const urls = {
    instagram: `https://instagram.com/${username}`,
    twitter: `https://x.com/${username}`,
    tiktok: `https://tiktok.com/@${username}`,
    linkedin: `https://linkedin.com/in/${username}`,
    facebook: `https://facebook.com/${username}`,
    youtube: `https://youtube.com/@${username}`,
  };
  return urls[platform?.toLowerCase()] || "#";
}

function socialLabel(platform) {
  const labels = {
    instagram: "Instagram",
    twitter: "X/Twitter",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    facebook: "Facebook",
    youtube: "YouTube",
  };
  return labels[platform?.toLowerCase()] || platform;
}

function socialIcon(platform) {
  const icons = {
    instagram: "image",
    twitter: "social-post",
    tiktok: "video",
    linkedin: "work",
    facebook: "social-post",
    youtube: "video",
  };
  return icons[platform?.toLowerCase()] || "social-post";
}

function outreachTone(status) {
  const tones = {
    converted: "success",
    in_conversation: "info",
    gifted: "info",
    outreach: "warning",
    qualified: "warning",
  };
  return tones[status] || "neutral";
}

function formatStatus(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [state, setState] = useState("loading");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCard();
  }, []);

  async function loadCard() {
    try {
      const selected = shopify.data?.selected;
      if (!selected || selected.length === 0) {
        setState("not_found");
        return;
      }

      const customerGid = selected[0].id;

      // Fetch customer email via Shopify GraphQL for fallback lookup
      let customerEmail = null;
      try {
        const gqlResult = await shopify.query(`
          query GetCustomer($id: ID!) {
            customer(id: $id) { email }
          }
        `, { variables: { id: customerGid } });
        customerEmail = gqlResult?.data?.customer?.email;
      } catch (e) {
        // Email is optional — continue without it
        console.warn("Failed to fetch customer email:", e);
      }

      // Get the Shopify session token
      const token = await shopify.auth.idToken();
      if (!token) {
        setState("error");
        setError("Unable to authenticate");
        return;
      }

      // Build the URL
      let url = `${API_BASE}/shopify-extension/customer-card?customer_gid=${encodeURIComponent(customerGid)}`;
      if (customerEmail) {
        url += `&customer_email=${encodeURIComponent(customerEmail)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setState("no_permission");
        return;
      }

      if (!res.ok) {
        const detail = await res.text();
        console.error("API error:", res.status, detail);
        setState("error");
        setError(`API returned ${res.status}`);
        return;
      }

      const payload = await res.json();
      if (!payload.found) {
        setState("not_found");
        return;
      }

      setData(payload);
      setState(payload.is_wrong_person ? "wrong_person" : "loaded");
    } catch (e) {
      console.error("Failed to load Mercana card:", e);
      setState("error");
      setError(e.message);
    }
  }

  if (state === "loading") {
    return (
      <s-admin-block heading="Mercana Intel">
        <s-stack direction="block" gap="base" padding="base base">
          <s-text color="subdued">Loading enrichment data...</s-text>
        </s-stack>
      </s-admin-block>
    );
  }

  if (state === "error") {
    return (
      <s-admin-block heading="Mercana Intel">
        <s-stack direction="block" gap="base" padding="base base">
          <s-text color="subdued">Unable to load enrichment data. Please try refreshing.</s-text>
        </s-stack>
      </s-admin-block>
    );
  }

  if (state === "no_permission") {
    return (
      <s-admin-block heading="Mercana Intel">
        <s-stack direction="block" gap="base" padding="base base">
          <s-text color="subdued">You don't have permission to view customer data. Contact your store admin.</s-text>
        </s-stack>
      </s-admin-block>
    );
  }

  if (state === "wrong_person") {
    const wpName = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown";
    return (
      <s-admin-block heading="Mercana Intel">
        <s-stack direction="block" gap="small-200">
          <s-stack direction="inline" gap="small-200">
            <s-text type="strong">{wpName}</s-text>
          </s-stack>
          <s-badge tone="warning" icon="alert">Profile data is being re-verified</s-badge>
          {data.historic_clv != null && (
            <s-text color="subdued">CLV: {formatMoney(data.historic_clv)}</s-text>
          )}
          {data.mercana_url && (
            <s-link href={data.mercana_url} target="_blank">
              View in Mercana →
            </s-link>
          )}
        </s-stack>
      </s-admin-block>
    );
  }

  if (state === "not_found") {
    return (
      <s-admin-block heading="Mercana Intel">
        <s-stack direction="block" gap="base" padding="base base">
          <s-text color="subdued">No enrichment data available for this customer.</s-text>
        </s-stack>
      </s-admin-block>
    );
  }

  // Build display values
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "Unknown";
  const initials = [data.first_name?.[0], data.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const titleLine = [data.current_job_title, data.current_company].filter(Boolean).join(" at ");

  const totalFollowers =
    (data.instagram_followers || 0) +
    (data.twitter_followers || 0) +
    (data.tiktok_followers || 0) +
    (data.linkedin_followers || 0);

  const followersByPlatform = {
    instagram: data.instagram_followers,
    twitter: data.twitter_followers,
    tiktok: data.tiktok_followers,
    linkedin: data.linkedin_followers,
  };

  // Collapsed summary (max 30 chars)
  let collapsedSummary = "";
  if (data.vip && data.short_signal_reason) {
    const firstReason = Object.values(data.short_signal_reason)[0];
    collapsedSummary = firstReason ? `VIP — ${firstReason}`.slice(0, 30) : "VIP";
  } else if (data.vip) {
    collapsedSummary = "VIP";
  } else if (titleLine) {
    collapsedSummary = titleLine.slice(0, 30);
  }

  const hasLocation = data.location_city || data.location_region;
  const hasHome = data.house_value_avg != null;
  const hasSignals = data.short_signal_reason && Object.keys(data.short_signal_reason).length > 0;
  const hasSocials = data.linkedin_url || (data.verified_socials && data.verified_socials.length > 0);

  const homeLabel = hasHome ? [
    data.home_is_rental && data.home_monthly_rent
      ? `Rents ~${formatMoney(data.home_monthly_rent)}/mo`
      : formatMoney(data.house_value_avg),
    data.home_property_type,
    data.home_bedrooms != null ? `${data.home_bedrooms}bd` : null,
    data.home_bathrooms != null ? `${data.home_bathrooms}ba` : null,
  ].filter(Boolean).join(' · ') : null;

  return (
    <s-admin-block heading="Mercana Intel" collapsedSummary={collapsedSummary}>
      <s-stack direction="block" gap="small-200">

        {/* === HEADER: Photo + Identity === */}
        <s-stack direction="inline" gap="base">
          <s-thumbnail src={data.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=e5e5e5&color=333`} alt={name} size="large" />
          <s-stack direction="block" gap="small-200">
            <s-stack direction="inline" gap="small-200">
              <s-text type="strong">{name}</s-text>
              {data.vip && <s-badge tone="caution">VIP</s-badge>}
              {data.ecom_persona_name && <s-badge tone="info" icon="affiliate">{data.ecom_persona_name}</s-badge>}
            </s-stack>
            {titleLine && <s-badge icon="work">{titleLine}</s-badge>}
            {hasSignals ? (
              <s-stack direction="inline" gap="small-200">
                {Object.entries(data.short_signal_reason).slice(0, 3).map(([key, value]) => {
                  const reasoning = data.signal_reasoning?.[key];
                  return reasoning ? (
                    <s-stack key={key} direction="inline" gap="none">
                      <s-tooltip id={`signal-${key}`}>{reasoning}</s-tooltip>
                      <s-clickable interestFor={`signal-${key}`}>
                        <s-badge tone="warning" icon="star">{formatSignal(key)}</s-badge>
                      </s-clickable>
                    </s-stack>
                  ) : (
                    <s-badge key={key} tone="warning" icon="star">{formatSignal(key)}</s-badge>
                  );
                })}
                {Object.keys(data.short_signal_reason).length > 3 && (
                  <s-badge tone="warning">+{Object.keys(data.short_signal_reason).length - 3}</s-badge>
                )}
              </s-stack>
            ) : (data.estimated_age != null || hasLocation || hasHome) ? (
              <s-stack direction="inline" gap="small-200">
                {data.estimated_age != null && <s-badge icon="person">~{data.estimated_age} yrs</s-badge>}
                {hasLocation && <s-badge icon="location">{[data.location_city, abbreviateState(data.location_region)].filter(Boolean).join(', ')}</s-badge>}
                {homeLabel && <s-badge tone="success" icon="home">{homeLabel}</s-badge>}
              </s-stack>
            ) : null}
          </s-stack>
        </s-stack>

        <s-divider />

        {/* === ABOUT + DETAILS === */}
        {data.short_summary && (
          <s-box padding="small-200 none">
            <s-text color="subdued">{data.short_summary}</s-text>
          </s-box>
        )}

        {/* Location/home shown below summary for VIPs */}
        {hasSignals && (hasLocation || hasHome || data.estimated_age != null) && (
          <s-stack direction="inline" gap="small-200">
            {data.estimated_age != null && <s-badge icon="person">~{data.estimated_age} yrs</s-badge>}
            {hasLocation && <s-badge icon="location">{[data.location_city, abbreviateState(data.location_region)].filter(Boolean).join(', ')}</s-badge>}
            {homeLabel && <s-badge tone="success" icon="home">{homeLabel}</s-badge>}
          </s-stack>
        )}

        {/* === SOCIAL === */}
        {hasSocials && <s-divider />}
        {hasSocials && (
          <s-stack direction="inline" gap="small-200">
              {data.linkedin_url && (
                <s-button href={data.linkedin_url} target="_blank" variant="primary" icon="work">
                  LinkedIn{data.linkedin_connections ? ` (${formatNumber(data.linkedin_connections)})` : ''}
                </s-button>
              )}
              {data.verified_socials && data.verified_socials.filter(s => s.platform !== "linkedin").map((s) => {
                const count = followersByPlatform[s.platform];
                return (
                  <s-button key={s.platform} href={socialUrl(s.platform, s.username)} target="_blank" variant="primary" icon={socialIcon(s.platform)}>
                    {socialLabel(s.platform)}{count ? ` (${formatNumber(count)})` : ''}
                  </s-button>
                );
              })}
          </s-stack>
        )}

        <s-divider />

        {/* === CTA === */}
        {data.mercana_url && (
          <s-link href={data.mercana_url} target="_blank">
            View full profile in Mercana →
          </s-link>
        )}
      </s-stack>
    </s-admin-block>
  );
}
