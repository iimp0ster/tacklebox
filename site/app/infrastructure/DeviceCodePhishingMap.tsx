'use client';

import type { AttackTrace, InfraNode, InfraRelation, InfraSample } from '../content/infrastructure';
import { KitInfrastructureMap } from './SneakyInfrastructureMap';

const nodes: InfraNode[] = [
  {
    "id": "delivery",
    "step": "01",
    "plane": "relay",
    "title": "Device-code client request",
    "role": "Protocol initiation",
    "summary": "A requesting client obtains device and user codes from Microsoft.",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "vantage": "Client application context · controlled lab telemetry",
    "telemetry": [
      "Client or application ID",
      "Requested resource and scopes",
      "Request time"
    ],
    "markers": [
      "POST to the device-code endpoint",
      "Client and tenant context"
    ],
    "caveat": "Standard Entra sign-in logs do not necessarily expose the raw device-code endpoint request."
  },
  {
    "id": "gate",
    "step": "02",
    "plane": "identity",
    "title": "Device and user codes issued",
    "role": "Code issuance",
    "summary": "Microsoft returns a device_code for the client, a user_code for presentation, a verification URI, expiry, and polling interval.",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "vantage": "Protocol response · controlled lab capture",
    "telemetry": [
      "Client and resource",
      "Issuance time",
      "Expiry and polling interval"
    ],
    "markers": [
      "device_code",
      "user_code",
      "verification_uri"
    ],
    "caveat": "Live codes and token material are never retained or published by this guide."
  },
  {
    "id": "relay",
    "step": "03",
    "plane": "delivery",
    "title": "Lure presents the user code",
    "role": "Delivery and evasion",
    "summary": "The lure delivers the attacker-requested user code and directs the victim toward Microsoft’s legitimate verification page.",
    "evidence": {
      "class": "source-observed",
      "confidence": "high",
      "scope": "Device code phishing evasion techniques · Multi-step social engineering flows",
      "validation": "source-reviewed"
    },
    "vantage": "Mail gateway · secure web gateway · browser history",
    "telemetry": [
      "Message and expanded URL",
      "Redirect chain",
      "Rendered prompt"
    ],
    "markers": [
      "SaaS-hosted handoff",
      "CAPTCHA or browser gate",
      "Device-code themed prompt"
    ],
    "caveat": "Shared SaaS hosting and CAPTCHA are context, not attribution."
  },
  {
    "id": "identity",
    "step": "04",
    "plane": "identity",
    "title": "Victim authorizes at Microsoft",
    "role": "Trusted authentication",
    "summary": "The victim enters the user code and completes authentication at the legitimate Microsoft identity provider.",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "vantage": "Entra sign-in logs · Conditional Access · authentication details",
    "telemetry": [
      "AuthenticationProtocol = deviceCode",
      "Application and resource",
      "User, result, IP, and time"
    ],
    "markers": [
      "Legitimate Microsoft sign-in",
      "Device-code authentication"
    ],
    "caveat": "The identity provider is the trusted control point, not attacker infrastructure."
  },
  {
    "id": "session",
    "step": "05",
    "plane": "relay",
    "title": "Client polls the token endpoint",
    "role": "Polling boundary",
    "summary": "While authorization is pending, the requesting client polls Microsoft’s token endpoint using the device_code and required interval.",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "vantage": "Client-side protocol capture · controlled lab telemetry",
    "telemetry": [
      "Client ID",
      "Polling interval",
      "authorization_pending outcome"
    ],
    "markers": [
      "Device-code grant type",
      "Repeated token requests"
    ],
    "caveat": "Raw polling is client-side protocol behavior and should not be claimed as a standard Entra sign-in-log field."
  },
  {
    "id": "operator",
    "step": "06",
    "plane": "identity",
    "title": "Tokens issued to the client",
    "role": "Token boundary",
    "summary": "After successful victim authorization, Microsoft returns authorized token material to the polling client.",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "vantage": "Entra sign-in context · controlled lab telemetry",
    "telemetry": [
      "Authentication protocol",
      "Client and resource",
      "Successful authorization time"
    ],
    "markers": [
      "Successful device-code authorization",
      "Token delivered to requesting client"
    ],
    "caveat": "Do not infer or publish raw token contents; correlate the server-owned authentication context instead."
  },
  {
    "id": "postauth",
    "step": "07",
    "plane": "operator",
    "title": "Token used against Microsoft 365",
    "role": "Authenticated operation",
    "summary": "The operator uses the authorized session to access Microsoft 365 from a context that may differ from the victim’s.",
    "evidence": {
      "class": "source-observed",
      "confidence": "high",
      "scope": "Device Code Phishing Keeps Evolving. Here’s What to Watch For · Key Takeaways",
      "validation": "source-reviewed"
    },
    "vantage": "Entra sign-ins · Microsoft 365 unified audit · workload activity",
    "telemetry": [
      "Source network and user agent",
      "Application and workload",
      "Time from authorization to use"
    ],
    "markers": [
      "New source context",
      "Post-authentication workload access"
    ],
    "caveat": "A changed source context is a prioritization signal; validate protocol, application, time, and user behavior together."
  }
];
const relations: InfraRelation[] = [
  {
    "id": "dc-r1",
    "from": "delivery",
    "to": "gate",
    "label": "requests codes",
    "kind": "authentication",
    "path": "M 120 120 L 325 95",
    "labelX": 220,
    "labelY": 88,
    "requirement": "required",
    "temporalRelationship": "after",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "data": {
      "eventClass": "Device authorization request",
      "values": [
        "client_id",
        "scope",
        "request time"
      ],
      "direction": "Requesting client → Microsoft device-code endpoint",
      "source": "Microsoft protocol documentation · Device authorization request",
      "visibility": "Controlled protocol capture",
      "joinKeys": [
        "client",
        "resource",
        "time"
      ],
      "correlation": "Bind the client and requested resource to the code-issuance window.",
      "boundary": "This relationship is bounded to the cited source role and locator."
    }
  },
  {
    "id": "dc-r2",
    "from": "gate",
    "to": "relay",
    "label": "client presents user code",
    "kind": "delivery",
    "path": "M 380 115 L 205 275",
    "labelX": 292,
    "labelY": 188,
    "requirement": "required",
    "temporalRelationship": "after",
    "evidence": {
      "class": "source-observed",
      "confidence": "high",
      "scope": "Device code phishing evasion techniques · Multi-step social engineering flows",
      "validation": "source-reviewed"
    },
    "data": {
      "eventClass": "Lure presentation after protocol issuance",
      "values": [
        "user_code prompt",
        "verification_uri",
        "lure time"
      ],
      "direction": "Requesting client → victim-visible lure",
      "source": "Microsoft protocol documentation · Device authorization response; Device code phishing evasion techniques · Multi-step social engineering flows",
      "visibility": "Source-reviewed lure evidence plus Microsoft protocol context",
      "joinKeys": [
        "client",
        "issuance time",
        "lure time"
      ],
      "correlation": "Correlate code issuance to the victim-visible prompt without retaining live codes.",
      "boundary": "This relationship is bounded to the cited source role and locator."
    }
  },
  {
    "id": "dc-r3",
    "from": "relay",
    "to": "identity",
    "label": "directs victim to authorize",
    "kind": "delivery",
    "path": "M 250 315 L 565 250",
    "labelX": 405,
    "labelY": 265,
    "requirement": "required",
    "temporalRelationship": "after",
    "evidence": {
      "class": "source-observed",
      "confidence": "high",
      "scope": "Device code phishing evasion techniques · Multi-step social engineering flows",
      "validation": "source-reviewed"
    },
    "data": {
      "eventClass": "Lure-to-identity handoff",
      "values": [
        "message URL",
        "redirect path",
        "prompt time"
      ],
      "direction": "Lure → victim browser → Microsoft verification URI",
      "source": "Device code phishing evasion techniques · Multi-step social engineering flows",
      "visibility": "Mail, web, and browser telemetry",
      "joinKeys": [
        "user",
        "URL",
        "time"
      ],
      "correlation": "Join the lure path to the subsequent device-code sign-in for the same user and time window.",
      "boundary": "This relationship is bounded to the cited source role and locator."
    }
  },
  {
    "id": "dc-r4",
    "from": "identity",
    "to": "session",
    "label": "authorizes while client polls",
    "kind": "authentication",
    "path": "M 620 250 C 690 210, 720 270, 675 350",
    "labelX": 710,
    "labelY": 250,
    "requirement": "required",
    "temporalRelationship": "concurrent",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "data": {
      "eventClass": "Device-code authorization and polling",
      "values": [
        "AuthenticationProtocol",
        "application",
        "result and time"
      ],
      "direction": "Victim authentication ↔ requesting client polling",
      "source": "Microsoft protocol documentation · Authenticating the user and polling /token",
      "visibility": "Entra sign-in context plus controlled client capture",
      "joinKeys": [
        "user",
        "application",
        "resource",
        "time"
      ],
      "correlation": "Correlate the server-owned deviceCode sign-in with the client polling window.",
      "boundary": "Standard Entra logs expose the deviceCode authentication context, not the raw polling request."
    }
  },
  {
    "id": "dc-r5",
    "from": "session",
    "to": "operator",
    "label": "receives tokens after success",
    "kind": "capture",
    "path": "M 650 390 L 500 460",
    "labelX": 575,
    "labelY": 420,
    "requirement": "required",
    "temporalRelationship": "after",
    "evidence": {
      "class": "platform-owned",
      "confidence": "high",
      "scope": "Microsoft OAuth 2.0 device authorization protocol",
      "validation": "source-reviewed"
    },
    "data": {
      "eventClass": "Successful device-code authorization",
      "values": [
        "AuthenticationProtocol",
        "client and resource",
        "success time"
      ],
      "direction": "Microsoft token endpoint → requesting client",
      "source": "Microsoft protocol documentation · Successful authentication response",
      "visibility": "Entra sign-in context and controlled lab receipt",
      "joinKeys": [
        "user",
        "application",
        "resource",
        "time"
      ],
      "correlation": "Join successful deviceCode authentication to the requesting client and resource.",
      "boundary": "Token contents remain excluded; validate server-owned protocol, client, resource, result, and time."
    }
  },
  {
    "id": "dc-r6",
    "from": "operator",
    "to": "postauth",
    "label": "enables workload access",
    "kind": "operation",
    "path": "M 455 485 L 260 505",
    "labelX": 360,
    "labelY": 475,
    "requirement": "required",
    "temporalRelationship": "after",
    "evidence": {
      "class": "source-observed",
      "confidence": "high",
      "scope": "Device Code Phishing Keeps Evolving. Here’s What to Watch For · Key Takeaways",
      "validation": "source-reviewed"
    },
    "data": {
      "eventClass": "Authenticated Microsoft 365 activity",
      "values": [
        "source context",
        "application",
        "workload operation"
      ],
      "direction": "Authorized client → Microsoft 365 workload",
      "source": "Device Code Phishing Keeps Evolving. Here’s What to Watch For · Key Takeaways",
      "visibility": "Entra and Microsoft 365 audit telemetry",
      "joinKeys": [
        "user",
        "application",
        "time"
      ],
      "correlation": "Join deviceCode success to the first subsequent workload activity and compare context.",
      "boundary": "This relationship is bounded to the cited source role and locator."
    }
  }
];
const traces: AttackTrace[] = [{ id: 'device-code-primary', label: 'Device-code lure-to-token trace', subjectScope: 'Two independent source-reviewed reports', steps: relations.map((relation, index) => ({ edgeId: relation.id, order: index + 1 })) }];
const samples: InfraSample[] = [
  {
    "id": "device-code-lure-source",
    "kit": "Device Code Phishing",
    "title": "Device code phishing evasion techniques",
    "sampleType": "Lure and evasion observation",
    "observed": "Multi-step social engineering flows",
    "evidence": "Multi-Factor Authentication Request Generation",
    "confidence": "high",
    "source": {
      "label": "Device code phishing evasion techniques",
      "url": "https://www.linkedin.com/posts/unit42_four-evasion-techniques-deliver-stealthy-activity-7486530417232224256-TE4R"
    },
    "nodeIds": [
      "relay",
      "identity"
    ],
    "artifacts": [
      {
        "type": "Evidence boundary",
        "value": "lure → legitimate verification page",
        "stability": "contextual",
        "meaning": "Pre-authentication delivery evidence; not proof of token issuance or attribution."
      }
    ],
    "queries": [],
    "chokepoint": "The lure must persuade the victim to cross the legitimate device-authorization boundary.",
    "blockGuidance": "Preserve redirect and rendered-page context; do not block shared SaaS or Microsoft endpoints as malicious infrastructure.",
    "falsePositiveBoundary": "Shared SaaS and device-code prompts can be legitimate; require user, application, resource, and time correlation."
  },
  {
    "id": "device-code-token-source",
    "kit": "Device Code Phishing",
    "title": "Device Code Phishing Keeps Evolving. Here’s What to Watch For",
    "sampleType": "Token-use observation",
    "observed": "Key Takeaways",
    "evidence": "Device-code phishing and Microsoft 365 token replay",
    "confidence": "high",
    "source": {
      "label": "Device Code Phishing Keeps Evolving. Here’s What to Watch For",
      "url": "https://www.huntress.com/blog/device-code-phishing-evolving-threats"
    },
    "nodeIds": [
      "identity",
      "operator",
      "postauth"
    ],
    "artifacts": [
      {
        "type": "Evidence boundary",
        "value": "deviceCode success → subsequent workload access",
        "stability": "durable",
        "meaning": "Identity and workload join retained without exposing token values."
      }
    ],
    "queries": [],
    "chokepoint": "The flow must cross Microsoft’s device-code authentication and token-use boundaries.",
    "blockGuidance": "Prioritize server-owned protocol and application fields, then validate subsequent access context.",
    "falsePositiveBoundary": "Legitimate device-code use exists; tune against approved applications and expected users."
  },
  {
    "id": "device-code-microsoft-protocol",
    "kit": "Device Code Phishing",
    "title": "Microsoft identity platform — OAuth 2.0 device authorization grant",
    "sampleType": "Platform protocol and telemetry",
    "observed": "Microsoft protocol and SigninLogs documentation",
    "evidence": "Grounds code issuance, token polling, and the AuthenticationProtocol field without claiming raw requests appear in standard sign-in logs.",
    "confidence": "high",
    "source": {
      "label": "Microsoft identity platform — OAuth 2.0 device authorization grant",
      "url": "https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-device-code"
    },
    "nodeIds": [
      "delivery",
      "gate",
      "identity",
      "session",
      "operator"
    ],
    "artifacts": [
      {
        "type": "Durable field",
        "value": "AuthenticationProtocol == \"deviceCode\"",
        "stability": "durable",
        "meaning": "Server-owned grant/protocol context available in Microsoft Entra sign-in telemetry."
      }
    ],
    "queries": [
      {
        "provider": "Microsoft Sentinel / Log Analytics",
        "query": "SigninLogs\n| where AuthenticationProtocol =~ \"deviceCode\"\n| project TimeGenerated, UserPrincipalName, AppDisplayName, AppId, ResourceDisplayName, IPAddress, ResultType, CorrelationId\n| order by TimeGenerated desc",
        "note": "Begin broad, establish approved device-code usage, then correlate application, resource, user, IP, result, and subsequent workload activity.",
        "url": "https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/signinlogs"
      }
    ],
    "chokepoint": "The authentication service must record the device-code grant when the user authorizes the requesting client.",
    "blockGuidance": "Use Conditional Access to restrict device-code flow after baselining legitimate use.",
    "falsePositiveBoundary": "Azure CLI, device onboarding, and input-constrained devices may use this protocol legitimately."
  }
];

export default function DeviceCodePhishingMap() {
  return <KitInfrastructureMap definition={{ kitId: 'device-code-phishing', kitName: 'Device Code Phishing', traceLabel: 'Device-code protocol trace', nodes, relations, traces, samples, anatomy: <section className="readiness-limitations"><div><p className="section-number">LURE ANATOMY</p><h2>Code delivery without a reverse proxy</h2></div><ul><li>The requesting client obtains device and user codes before the lure presents the user code.</li><li>Multi-step SaaS redirects, CAPTCHA, blob delivery, or rendered-text obfuscation can shield the prompt from automated analysis.</li><li>The victim authenticates at Microsoft while the requesting client polls the token endpoint.</li></ul></section> }} />;
}
