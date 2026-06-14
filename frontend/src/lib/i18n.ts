export type LanguageCode = "en" | "mr" | "hi" | "gu";

export type Tone = "success" | "warning" | "danger" | "info";

type TouchpointCopy = {
  title: string;
  detail: string;
  status: string;
  tone: Tone;
};

type MetricCopy = {
  label: string;
  value?: string;
  helper: string;
};

type ActionCopy = {
  title: string;
  detail: string;
  status: string;
  tone: Tone;
};

type ConversationPanelCopy = {
  launcherLabel: string;
  title: string;
  subtitle: string;
  assistantName: string;
  farmerLabel: string;
  systemLabel: string;
  closeLabel: string;
  inputPlaceholder: string;
  sendLabel: string;
  ready: string;
  running: string;
  liveAi: string;
  demoFallback: string;
  callSignLabel: string;
  liveCall: string;
  callReady: string;
  callActive: string;
  connectingCall: string;
  fallbackCall: string;
  fallbackRecording: string;
  liveCallUnavailable: string;
  startCall: string;
  endCall: string;
  liveCallPrompt: (callSign: string) => string;
  audioReply: string;
  recordLabel: string;
  stopRecording: string;
  recording: string;
  attachAudio: string;
  farmerAudio: string;
  audioPrompt: string;
  typing: string;
  micUnavailable: string;
  quickActions: {
    today: string;
    approvals: string;
    risk: string;
    robot: string;
    outcome: string;
    communication: string;
    analyzeLeaf: string;
    reviewApproval: string;
  };
  prompts: {
    today: string;
    approvals: string;
    risk: (zoneName: string) => string;
    robot: string;
    outcome: string;
    communication: string;
  };
  context: {
    priority: string;
    approvals: string;
    robot: string;
    outcome: string;
    tank: string;
    communication: string;
    noPriority: string;
    noApprovals: string;
    noRobot: string;
    noOutcome: string;
    noCommunication: string;
  };
  system: {
    languageChanged: (languageName: string) => string;
    reviewOpened: string;
    noApproval: string;
    visionStarted: string;
    visionFailed: string;
    voiceFailed: string;
    fallback: string;
  };
};

export type AppCopy = {
  language: {
    label: string;
    shortLabel: string;
    farmerBrief: string;
    voicePrompt: string;
    voiceResponse: string;
    escalation: string;
  };
  farmNames: Record<string, string>;
  zoneNames: Record<string, string>;
  header: {
    subtitle: string;
    farmDescription: (farmName: string) => string;
    forecast: string;
    localTime: string;
    languageLabel: string;
    selectLanguageAria: string;
    farmAdmin: string;
  };
  statusSummary: Record<"loading" | "ok" | "error", string>;
  workflowMessages: {
    initial: string;
    loaded: (workflow: string) => string;
    fallback: (message: string) => string;
    runningVision: string;
    runningVoice: string;
    visionFailed: string;
    voiceFailed: string;
  };
  map: {
    eyebrow: string;
    title: string;
    action: string;
    imageAlt: string;
    mango: string;
    trees: string;
    sensors: string;
    valve: string;
    robot: string;
    leafScan: string;
    tank: string;
    gate: string;
    mangoBlock: string;
    calibratedPath: string;
    controls: {
      zoomIn: string;
      zoomOut: string;
      center: string;
      centerShort: string;
    };
    legend: {
      sensors: string;
      robot: string;
      dripValves: string;
      waterTank: string;
      mangoBlocks: string;
      pathCalibrated: string;
    };
    orchard: Record<string, { variety: string; activeIssue: string }>;
  };
  riskLabels: Record<"critical" | "high" | "medium" | "low", string>;
  agentTimeline: {
    title: string;
    review: string;
    confidence: string;
    ms: string;
    workflows: Record<string, string>;
    agents: Record<string, string>;
  };
  touchpointsPanel: {
    eyebrow: string;
    title: string;
    selectedLanguage: string;
    analyzeLeaf: string;
    callMyFarm: string;
    touchpoints: TouchpointCopy[];
  };
  conversationPanel: ConversationPanelCopy;
  metricsPanel: {
    eyebrow: string;
    title: string;
    updated: string;
    noPriorityBlock: string;
    noRobot: string;
    soilMoisture: string;
    needsApproval: (count: number) => string;
    points: string;
    cards: {
      mangoTrees: MetricCopy;
      priorityBlock: MetricCopy;
      robot: MetricCopy;
      tankLevel: MetricCopy;
      openAlerts: MetricCopy;
      nextVerify: MetricCopy;
    };
  };
  evaluationsPanel: {
    eyebrow: string;
    title: string;
    quality: string;
    confidence: string;
    latency: string;
    cost: string;
    excellent: string;
    high: string;
    endToEnd: string;
    demoRun: string;
    reviewGate: (zoneName: string) => string;
    none: string;
  };
  actionsPanel: {
    eyebrow: string;
    title: string;
    fallbackQueue: ActionCopy[];
    actionTypes: Record<string, string>;
  };
  communicationPanel: {
    eyebrow: string;
    title: string;
    channels: Record<string, { label: string; status: string }>;
  };
  memoryPanel: {
    eyebrow: string;
    title: string;
    outcomeAgent: string;
    baseline: (zoneName: string) => string;
    priorityZone: string;
    events: string[];
  };
  footer: {
    backend: string;
    connectedSensors: string;
    activeRobot: string;
    pendingAlerts: string;
  };
  common: {
    none: string;
    fallbackData: string;
    farmAdmin: string;
    server: string;
    system: string;
    syncingTime: string;
  };
  statuses: Record<string, string>;
  robotStatuses: Record<string, string>;
  knownText: Record<string, string>;
  patterns: {
    sensorCritical: (moisture: string) => string;
    outcomeMoisture: (before: string, after: string) => string;
  };
};

export const translations: Record<LanguageCode, AppCopy> = {
  en: {
    language: {
      label: "English",
      shortLabel: "EN",
      farmerBrief:
        "Zone B needs water stress response. Drip irrigation is queued, Robot R1 is inspecting Tree 23, and treatment is waiting for your approval.",
      voicePrompt: "Call my farm and give me today's mango orchard status.",
      voiceResponse:
        "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.",
      escalation: "Send warning on WhatsApp, critical follow-up by SMS and phone."
    },
    farmNames: {
      "Ratnagiri Mango Estate": "Ratnagiri Mango Estate"
    },
    zoneNames: {
      "Zone A": "Zone A",
      "Zone B": "Zone B",
      "Zone C": "Zone C",
      "Zone D": "Zone D"
    },
    header: {
      subtitle: "Autonomous Mango Farm Command Center",
      farmDescription: (farmName) =>
        `${farmName} is onboarded with section layout, robot route, drip valves, sensor mesh, voice, vision, and communication gateway.`,
      forecast: "28°C forecast",
      localTime: "10:30 AM IST",
      languageLabel: "Language",
      selectLanguageAria: "Select farmer language",
      farmAdmin: "Farm Admin"
    },
    statusSummary: {
      loading: "Checking backend",
      ok: "Live backend connected",
      error: "Demo fallback active"
    },
    workflowMessages: {
      initial: "Backend workflow data will replace mock data when available.",
      loaded: (workflow) => `Loaded ${workflow} workflow from backend.`,
      fallback: (message) => `Using local fallback data: ${message}`,
      runningVision: "Running Vision Agent fallback workflow...",
      runningVoice: "Calling the farm manager...",
      visionFailed: "Vision workflow failed.",
      voiceFailed: "Voice workflow failed."
    },
    map: {
      eyebrow: "Farm map",
      title: "Mango Sections, Sensors, Robot Path",
      action: "Live layout registered",
      imageAlt: "Top-down mango orchard map with four farm sections and a water tank",
      mango: "mango",
      trees: "trees",
      sensors: "Sensor",
      valve: "Valve",
      robot: "Robot 78%",
      leafScan: "Leaf scan",
      tank: "Tank 65%",
      gate: "Gate",
      mangoBlock: "Mango block",
      calibratedPath: "Calibrated path",
      controls: {
        zoomIn: "Zoom in",
        zoomOut: "Zoom out",
        center: "Center map",
        centerShort: "CTR"
      },
      legend: {
        sensors: "Sensors",
        robot: "Robot",
        dripValves: "Drip valves",
        waterTank: "Water tank",
        mangoBlocks: "Mango blocks",
        pathCalibrated: "Path calibrated"
      },
      orchard: {
        "zone-a": { variety: "Alphonso", activeIssue: "Healthy canopy" },
        "zone-b": { variety: "Kesar", activeIssue: "Water stress" },
        "zone-c": { variety: "Dasheri", activeIssue: "Leaf spot watch" },
        "zone-d": { variety: "Young grafts", activeIssue: "Stable" }
      }
    },
    riskLabels: {
      critical: "Critical",
      high: "Attention",
      medium: "Watch",
      low: "Healthy"
    },
    agentTimeline: {
      title: "Agent Execution Timeline",
      review: "review",
      confidence: "confidence",
      ms: "ms",
      workflows: {
        sensor_anomaly: "sensor anomaly",
        vision: "vision",
        voice: "voice",
        outcome_verification: "outcome verification"
      },
      agents: {
        supervisor: "Supervisor Agent",
        sensor: "Sensor Agent",
        weather: "Weather Agent",
        vision: "Vision Agent",
        risk: "Risk Agent",
        planner: "Planner Agent",
        robot: "Robot Agent",
        communication: "AgriOS Saathi",
        outcome: "Outcome Agent",
        evaluation: "Evaluation Agent",
        memory: "Memory Agent",
        voice: "Voice Agent"
      }
    },
    touchpointsPanel: {
      eyebrow: "Farmer touchpoints",
      title: "Language, Alerts, Approvals",
      selectedLanguage: "Selected language",
      analyzeLeaf: "Analyze Leaf",
      callMyFarm: "Call My Farm",
      touchpoints: [
        {
          title: "Call My Farm",
          detail: "Voice Agent can brief active risks, actions, approvals, and verified outcomes.",
          status: "Ready",
          tone: "success"
        },
        {
          title: "Approval Inbox",
          detail: "High-risk spray treatment is held until farmer approval.",
          status: "1 pending",
          tone: "warning"
        },
        {
          title: "Leaf Capture",
          detail: "Vision workflow attached to Tree 23 in Zone B.",
          status: "Fallback safe",
          tone: "info"
        },
        {
          title: "Communication Gateway",
          detail: "WhatsApp preferred, Telegram backup, SMS plus phone for critical alerts.",
          status: "Simulated",
          tone: "success"
        }
      ]
    },
    conversationPanel: {
      launcherLabel: "Ask AgriOS Saathi",
      title: "AgriOS Saathi",
      subtitle: "Farmer conversation",
      assistantName: "AgriOS Saathi",
      farmerLabel: "Farmer",
      systemLabel: "System",
      closeLabel: "Close",
      inputPlaceholder: "Message AgriOS about your farm",
      sendLabel: "Send",
      ready: "Ready",
      running: "Checking",
      liveAi: "Live AI",
      demoFallback: "Demo fallback",
      callSignLabel: "Call sign",
      liveCall: "Live call",
      callReady: "Ready",
      callActive: "On call",
      connectingCall: "Connecting",
      fallbackCall: "Recording fallback",
      fallbackRecording: "Recording fallback is active.",
      liveCallUnavailable: "Live AI call is unavailable.",
      startCall: "Start call",
      endCall: "End call",
      liveCallPrompt: (callSign) => `Live call ${callSign}`,
      audioReply: "Audio reply",
      recordLabel: "Record",
      stopRecording: "Stop",
      recording: "Recording farmer message",
      attachAudio: "Attach audio",
      farmerAudio: "Farmer audio",
      audioPrompt: "Voice message",
      typing: "AgriOS Saathi is checking the farm state...",
      micUnavailable: "Microphone is unavailable in this browser.",
      quickActions: {
        today: "Today's status",
        approvals: "Approvals",
        risk: "Zone risk",
        robot: "Robot R1",
        outcome: "Outcome",
        communication: "Communication",
        analyzeLeaf: "Analyze leaf",
        reviewApproval: "Review approval"
      },
      prompts: {
        today: "Call my farm and give me today's mango orchard status.",
        approvals: "What needs approval right now?",
        risk: (zoneName) => `Why is ${zoneName} at risk?`,
        robot: "Where is Robot R1 now?",
        outcome: "Did irrigation work?",
        communication: "What messages were sent to the farmer?"
      },
      context: {
        priority: "Priority",
        approvals: "Approvals",
        robot: "Robot",
        outcome: "Outcome",
        tank: "Tank",
        communication: "Communication",
        noPriority: "Stable",
        noApprovals: "None pending",
        noRobot: "No robot",
        noOutcome: "Waiting",
        noCommunication: "No message yet"
      },
      system: {
        languageChanged: (languageName) => `Future replies will use ${languageName}.`,
        reviewOpened: "Approval review opened in Farm Admin.",
        noApproval: "No pending approvals to review.",
        visionStarted: "Leaf analysis started for Tree 23 in Zone B.",
        visionFailed: "Leaf analysis could not complete.",
        voiceFailed: "Farm assistant could not answer right now.",
        fallback: "Demo fallback is active."
      }
    },
    metricsPanel: {
      eyebrow: "Live metrics",
      title: "Operational Readiness",
      updated: "Updated 10:30:25 AM",
      noPriorityBlock: "No priority block",
      noRobot: "No robot",
      soilMoisture: "soil moisture",
      needsApproval: (count) => `${count} needs approval`,
      points: "pts",
      cards: {
        mangoTrees: { label: "Mango trees", value: "564", helper: "4 onboarded sections" },
        priorityBlock: { label: "Priority block", helper: "24% soil moisture" },
        robot: { label: "Robot R1", helper: "On calibrated path" },
        tankLevel: { label: "Tank level", value: "65%", helper: "Enough for 2 cycles" },
        openAlerts: { label: "Open alerts", helper: "1 needs approval" },
        nextVerify: { label: "Next verify", value: "10 min", helper: "Outcome Agent scheduled" }
      }
    },
    evaluationsPanel: {
      eyebrow: "Agent evaluations",
      title: "Quality, Cost, Review Risk",
      quality: "Quality",
      confidence: "Confidence",
      latency: "Latency",
      cost: "Cost",
      excellent: "Excellent",
      high: "High",
      endToEnd: "End to end",
      demoRun: "Demo run",
      reviewGate: (zoneName) =>
        `High-risk or low-confidence actions stay reviewable. Current review gate: ${zoneName} treatment approval.`,
      none: "none"
    },
    actionsPanel: {
      eyebrow: "Autonomous actions",
      title: "Planner Queue And Human Review",
      fallbackQueue: [
        {
          title: "Drip irrigation queued",
          detail: "Zone B - 12 minutes at 7:00 PM",
          status: "scheduled",
          tone: "success"
        },
        {
          title: "Robot inspection assigned",
          detail: "R1 route: Gate 1 -> Zone B -> Tree 23 -> Tank bay",
          status: "active",
          tone: "info"
        },
        {
          title: "Treatment review",
          detail: "Possible fungal risk. Requires farmer approval before spraying.",
          status: "approval",
          tone: "warning"
        },
        {
          title: "Outcome verification",
          detail: "Compare moisture baseline against follow-up telemetry.",
          status: "waiting",
          tone: "info"
        }
      ],
      actionTypes: {
        schedule_irrigation: "Drip irrigation queued",
        robot_inspection: "Robot inspection assigned",
        farmer_voice_brief: "Farmer voice brief",
        verify_outcome: "Outcome verification",
        treatment_review: "Treatment review"
      }
    },
    communicationPanel: {
      eyebrow: "Communication gateway",
      title: "Escalation And Delivery",
      channels: {
        in_app: { label: "In-app", status: "online" },
        whatsapp: { label: "WhatsApp", status: "preferred" },
        telegram: { label: "Telegram", status: "backup" },
        sms: { label: "SMS", status: "critical" },
        phone_call: { label: "Phone", status: "critical" }
      }
    },
    memoryPanel: {
      eyebrow: "Memory and outcome",
      title: "Farm Journal",
      outcomeAgent: "Outcome Agent",
      baseline: (zoneName) =>
        `Baseline moisture in ${zoneName} is stored. Follow-up telemetry will verify if irrigation worked.`,
      priorityZone: "priority zone",
      events: [
        "Zone B improved by 14 points after the last short irrigation cycle.",
        "Kesar block showed repeat stress when tank level dropped below 55%.",
        "Farmer prefers Marathi voice brief and WhatsApp approval links.",
        "Previous fungal alert was downgraded after robot close-up review."
      ]
    },
    footer: {
      backend: "Backend",
      connectedSensors: "Connected sensors",
      activeRobot: "Active robot",
      pendingAlerts: "Pending alerts"
    },
    common: {
      none: "None",
      fallbackData: "Fallback data",
      farmAdmin: "Farm Admin",
      server: "Server",
      system: "System",
      syncingTime: "Syncing time"
    },
    statuses: {
      completed: "completed",
      queued: "queued",
      fallback: "fallback",
      review: "review",
      scheduled: "scheduled",
      active: "active",
      approval: "approval",
      waiting: "waiting",
      recommended: "recommended",
      needs_approval: "needs approval",
      pending_verification: "pending verification",
      verified: "verified",
      failed: "failed",
      online: "online",
      preferred: "preferred",
      backup: "backup",
      critical: "critical",
      simulated: "simulated",
      sent: "sent",
      delivered: "delivered",
      successful: "successful",
      partial: "partial",
      ready: "ready"
    },
    robotStatuses: {
      available: "available",
      assigned: "assigned",
      charging: "charging",
      offline: "offline"
    },
    knownText: {
      "Checking backend health...": "Checking backend health...",
      "Routed Zone B mango moisture anomaly into the sensor anomaly workflow.":
        "Routed Zone B mango moisture anomaly into the sensor anomaly workflow.",
      "Supervisor routed the event into the correct AgriOS workflow.":
        "Supervisor routed the event into the correct AgriOS workflow.",
      "Zone B soil moisture is low at 24% with rising canopy temperature.":
        "Zone B soil moisture is low at 24% with rising canopy temperature.",
      "Mock forecast shows no heavy rain in the next 6 hours.":
        "Mock forecast shows no heavy rain in the next 6 hours.",
      "Leaf image from Tree 23 shows possible early fungal marks.":
        "Leaf image from Tree 23 shows possible early fungal marks.",
      "Possible early blight detected on the demo leaf image.":
        "Possible early blight detected on the demo leaf image.",
      "Water stress is high; treatment risk requires farmer review.":
        "Water stress is high; treatment risk requires farmer review.",
      "Water stress is high; treatment decisions require farmer review.":
        "Water stress is high; treatment decisions require farmer review.",
      "Zone B water stress is high and should be acted on.":
        "Zone B water stress is high and should be acted on.",
      "Scheduled drip irrigation, robot inspection, communication, and outcome verification.":
        "Scheduled drip irrigation, robot inspection, communication, and outcome verification.",
      "Scheduled irrigation, robot inspection, communication, and outcome verification.":
        "Scheduled irrigation, robot inspection, communication, and outcome verification.",
      "Robot R1 assigned to Gate 1 -> Zone B -> Tree 23 -> Tank bay route.":
        "Robot R1 assigned to Gate 1 -> Zone B -> Tree 23 -> Tank bay route.",
      "Robot R1 remains available for inspection.": "Robot R1 remains available for inspection.",
      "Farmer notification simulated through WhatsApp with SMS and phone escalation ready.":
        "Farmer notification simulated through WhatsApp with SMS and phone escalation ready.",
      "Stored Zone B moisture baseline and scheduled follow-up telemetry comparison.":
        "Stored Zone B moisture baseline and scheduled follow-up telemetry comparison.",
      "Stored Zone B moisture baseline and verified simulated follow-up telemetry.":
        "Stored Zone B moisture baseline and verified simulated follow-up telemetry.",
      "Workflow quality is high; one human-review gate is correctly preserved.":
        "Workflow quality is high; one human-review gate is correctly preserved.",
      "Workflow quality is high; human-review gates are visible.":
        "Workflow quality is high; human-review gates are visible.",
      "Wrote farm journal entry for Zone B moisture stress, robot route, and farmer approval.":
        "Wrote farm journal entry for Zone B moisture stress, robot route, and farmer approval.",
      "Wrote farm journal entry for the latest workflow.":
        "Wrote farm journal entry for the latest workflow.",
      "Voice prompt received and normalized for farm-state lookup.":
        "Voice prompt received and normalized for farm-state lookup.",
      "Farm status response generated with text fallback.":
        "Farm status response generated with text fallback.",
      "Voice Agent retrieved recent risks, scheduled actions, pending approvals, and outcomes.":
        "Voice Agent retrieved recent risks, scheduled actions, pending approvals, and outcomes.",
      "12 minute drip irrigation scheduled for Zone B.":
        "12 minute drip irrigation scheduled for Zone B.",
      "Robot R1 assigned to inspect Tree 23 for water stress and leaf marks.":
        "Robot R1 assigned to inspect Tree 23 for water stress and leaf marks.",
      "Robot R1 assigned to inspect Tree 23 and the Zone B drip line.":
        "Robot R1 assigned to inspect Tree 23 and the Zone B drip line.",
      "Marathi voice brief prepared for the farmer.": "Marathi voice brief prepared for the farmer.",
      "Outcome Agent will compare follow-up telemetry after irrigation.":
        "Outcome Agent will compare follow-up telemetry after irrigation.",
      "Possible fungal treatment is held for farmer approval before spraying.":
        "Possible fungal treatment is held for farmer approval before spraying.",
      "Vision Agent found possible early fungal marks. Spraying requires farmer approval.":
        "Vision Agent found possible early fungal marks. Spraying requires farmer approval.",
      "Fungal treatment review": "Fungal treatment review",
      "Zone B improved by 14 points after the last short irrigation cycle.":
        "Zone B improved by 14 points after the last short irrigation cycle.",
      "Kesar block showed repeat stress when tank level dropped below 55%.":
        "Kesar block showed repeat stress when tank level dropped below 55%.",
      "Farmer prefers Marathi voice brief and WhatsApp approval links.":
        "Farmer prefers Marathi voice brief and WhatsApp approval links.",
      "Farmer prefers Marathi voice briefs and WhatsApp approval links.":
        "Farmer prefers Marathi voice briefs and WhatsApp approval links.",
      "Previous fungal alert was downgraded after robot close-up review.":
        "Previous fungal alert was downgraded after robot close-up review.",
      "Recorded low moisture, scheduled irrigation, simulated farmer alert, and verified outcome.":
        "Recorded low moisture, scheduled irrigation, simulated farmer alert, and verified outcome.",
      "Recorded fallback leaf analysis, robot inspection, and treatment approval request.":
        "Recorded fallback leaf analysis, robot inspection, and treatment approval request.",
      "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.":
        "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.",
      "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.":
        "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.",
      "Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe, Robot R1 tapasnisathi Zone B madhye aahe, ani pudhchya 6 tasat motha paus expected nahi.":
        "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours."
    },
    patterns: {
      sensorCritical: (moisture) => `Zone B soil moisture is critically low at ${moisture}%.`,
      outcomeMoisture: (before, after) => `Zone B moisture increased from ${before}% to ${after}% after irrigation.`
    }
  },
  mr: {
    language: {
      label: "मराठी",
      shortLabel: "MR",
      farmerBrief:
        "झोन B मध्ये मातीतील ओलावा कमी आहे. ड्रिप सिंचन रांगेत आहे, Robot R1 झाड 23 तपासत आहे आणि उपचारासाठी तुमची मंजुरी बाकी आहे.",
      voicePrompt: "माझ्या शेताचा आजचा आंबा बागेचा अहवाल सांगा.",
      voiceResponse:
        "झोन B कोरडा आहे, सिंचन नियोजित आहे, Robot R1 पिकाची तपासणी करत आहे आणि पुढील 6 तासांत मोठ्या पावसाची शक्यता नाही.",
      escalation: "इशारा WhatsApp वर पाठवा; गंभीर पाठपुरावा SMS आणि फोन कॉलने करा."
    },
    farmNames: {
      "Ratnagiri Mango Estate": "रत्नागिरी आंबा इस्टेट"
    },
    zoneNames: {
      "Zone A": "झोन A",
      "Zone B": "झोन B",
      "Zone C": "झोन C",
      "Zone D": "झोन D"
    },
    header: {
      subtitle: "स्वयंचलित आंबा फार्म कमांड सेंटर",
      farmDescription: (farmName) =>
        `${farmName} मध्ये विभाग नकाशा, रोबोट मार्ग, ड्रिप वाल्व, सेन्सर जाळे, आवाज, दृश्य तपासणी आणि कम्युनिकेशन गेटवे जोडले आहेत.`,
      forecast: "28°C हवामान अंदाज",
      localTime: "10:30 AM IST",
      languageLabel: "भाषा",
      selectLanguageAria: "शेतकऱ्याची भाषा निवडा",
      farmAdmin: "शेत प्रशासक"
    },
    statusSummary: {
      loading: "बॅकेंड तपासत आहे",
      ok: "लाईव्ह बॅकेंड जोडले आहे",
      error: "डेमो फॉलबॅक सक्रिय"
    },
    workflowMessages: {
      initial: "उपलब्ध झाल्यावर बॅकेंड वर्कफ्लो डेटा मॉक डेटाऐवजी दिसेल.",
      loaded: (workflow) => `बॅकेंडमधून ${workflow} वर्कफ्लो लोड झाला.`,
      fallback: (message) => `स्थानिक फॉलबॅक डेटा वापरत आहे: ${message}`,
      runningVision: "Vision Agent फॉलबॅक वर्कफ्लो चालवत आहे...",
      runningVoice: "फार्म मॅनेजरला कॉल करत आहे...",
      visionFailed: "Vision वर्कफ्लो अयशस्वी झाला.",
      voiceFailed: "Voice वर्कफ्लो अयशस्वी झाला."
    },
    map: {
      eyebrow: "फार्म नकाशा",
      title: "आंबा विभाग, सेन्सर, रोबोट मार्ग",
      action: "लाईव्ह लेआउट नोंदले",
      imageAlt: "चार फार्म विभाग आणि पाण्याची टाकी असलेला वरून दिसणारा आंबा बाग नकाशा",
      mango: "आंबा",
      trees: "झाडे",
      sensors: "सेन्सर",
      valve: "वाल्व",
      robot: "रोबोट 78%",
      leafScan: "पान तपासणी",
      tank: "टाकी 65%",
      gate: "गेट",
      mangoBlock: "आंबा विभाग",
      calibratedPath: "कॅलिब्रेट मार्ग",
      controls: {
        zoomIn: "झूम वाढवा",
        zoomOut: "झूम कमी करा",
        center: "नकाशा मध्यभागी आणा",
        centerShort: "मध्य"
      },
      legend: {
        sensors: "सेन्सर",
        robot: "रोबोट",
        dripValves: "ड्रिप वाल्व",
        waterTank: "पाण्याची टाकी",
        mangoBlocks: "आंबा विभाग",
        pathCalibrated: "मार्ग कॅलिब्रेट"
      },
      orchard: {
        "zone-a": { variety: "अल्फोन्सो", activeIssue: "निरोगी छत्री" },
        "zone-b": { variety: "केसर", activeIssue: "पाण्याचा ताण" },
        "zone-c": { variety: "दशेरी", activeIssue: "पान डाग निरीक्षण" },
        "zone-d": { variety: "नवीन कलमे", activeIssue: "स्थिर" }
      }
    },
    riskLabels: {
      critical: "गंभीर",
      high: "लक्ष द्या",
      medium: "निरीक्षण",
      low: "निरोगी"
    },
    agentTimeline: {
      title: "एजंट अंमलबजावणी टाइमलाइन",
      review: "पुनरावलोकन",
      confidence: "विश्वास",
      ms: "मि.से.",
      workflows: {
        sensor_anomaly: "सेन्सर विसंगती",
        vision: "दृश्य तपासणी",
        voice: "आवाज",
        outcome_verification: "परिणाम पडताळणी"
      },
      agents: {
        supervisor: "Supervisor Agent",
        sensor: "Sensor Agent",
        weather: "Weather Agent",
        vision: "Vision Agent",
        risk: "Risk Agent",
        planner: "Planner Agent",
        robot: "Robot Agent",
        communication: "AgriOS Saathi",
        outcome: "Outcome Agent",
        evaluation: "Evaluation Agent",
        memory: "Memory Agent",
        voice: "Voice Agent"
      }
    },
    touchpointsPanel: {
      eyebrow: "शेतकरी संपर्क",
      title: "भाषा, अलर्ट, मंजुरी",
      selectedLanguage: "निवडलेली भाषा",
      analyzeLeaf: "पान विश्लेषित करा",
      callMyFarm: "माझ्या शेताला कॉल करा",
      touchpoints: [
        {
          title: "माझ्या शेताला कॉल करा",
          detail: "Voice Agent सक्रिय धोके, कृती, मंजुरी आणि पडताळलेले परिणाम सांगू शकतो.",
          status: "तयार",
          tone: "success"
        },
        {
          title: "मंजुरी इनबॉक्स",
          detail: "उच्च-जोखीम फवारणी उपचार शेतकऱ्याच्या मंजुरीपर्यंत थांबवले आहेत.",
          status: "1 बाकी",
          tone: "warning"
        },
        {
          title: "पान कॅप्चर",
          detail: "Vision वर्कफ्लो झोन B मधील झाड 23 शी जोडले आहे.",
          status: "फॉलबॅक सुरक्षित",
          tone: "info"
        },
        {
          title: "कम्युनिकेशन गेटवे",
          detail: "WhatsApp प्राधान्य, Telegram बॅकअप, गंभीर अलर्टसाठी SMS आणि फोन.",
          status: "सिम्युलेटेड",
          tone: "success"
        }
      ]
    },
    conversationPanel: {
      launcherLabel: "AgriOS ला विचारा",
      title: "AgriOS शेत सहाय्यक",
      subtitle: "शेतकरी संवाद",
      assistantName: "AgriOS Saathi",
      farmerLabel: "शेतकरी",
      systemLabel: "सिस्टम",
      closeLabel: "बंद",
      inputPlaceholder: "तुमच्या शेताबद्दल AgriOS ला संदेश पाठवा",
      sendLabel: "पाठवा",
      ready: "तयार",
      running: "तपासत आहे",
      liveAi: "लाइव्ह AI",
      demoFallback: "डेमो फॉलबॅक",
      callSignLabel: "कॉल साइन",
      liveCall: "लाइव्ह कॉल",
      callReady: "तयार",
      callActive: "कॉल सुरू",
      connectingCall: "जोडत आहे",
      fallbackCall: "रेकॉर्डिंग फॉलबॅक",
      fallbackRecording: "रेकॉर्डिंग फॉलबॅक सक्रिय आहे.",
      liveCallUnavailable: "लाइव्ह AI कॉल उपलब्ध नाही.",
      startCall: "कॉल सुरू करा",
      endCall: "कॉल संपवा",
      liveCallPrompt: (callSign) => `लाइव्ह कॉल ${callSign}`,
      audioReply: "ऑडिओ उत्तर",
      recordLabel: "रेकॉर्ड",
      stopRecording: "थांबा",
      recording: "शेतकरी संदेश रेकॉर्ड होत आहे",
      attachAudio: "ऑडिओ जोडा",
      farmerAudio: "शेतकरी ऑडिओ",
      audioPrompt: "आवाज संदेश",
      typing: "AgriOS शेताची स्थिती तपासत आहे...",
      micUnavailable: "या ब्राउझरमध्ये मायक्रोफोन उपलब्ध नाही.",
      quickActions: {
        today: "आजची स्थिती",
        approvals: "मंजुरी",
        risk: "झोन जोखीम",
        robot: "Robot R1",
        outcome: "परिणाम",
        communication: "संदेश",
        analyzeLeaf: "पान तपासा",
        reviewApproval: "मंजुरी पाहा"
      },
      prompts: {
        today: "माझ्या शेताचा आजचा आंबा बागेचा अहवाल सांगा.",
        approvals: "आत्ता कोणत्या गोष्टींना मंजुरी हवी आहे?",
        risk: (zoneName) => `${zoneName} मध्ये जोखीम का आहे?`,
        robot: "Robot R1 सध्या कुठे आहे?",
        outcome: "सिंचन कामी आले का?",
        communication: "शेतकऱ्याला कोणते संदेश पाठवले गेले?"
      },
      context: {
        priority: "प्राधान्य",
        approvals: "मंजुरी",
        robot: "रोबोट",
        outcome: "परिणाम",
        tank: "टाकी",
        communication: "संदेश",
        noPriority: "स्थिर",
        noApprovals: "काही बाकी नाही",
        noRobot: "रोबोट नाही",
        noOutcome: "प्रतीक्षा",
        noCommunication: "अजून संदेश नाही"
      },
      system: {
        languageChanged: (languageName) => `पुढील उत्तरे ${languageName} मध्ये येतील.`,
        reviewOpened: "Farm Admin मध्ये मंजुरी पुनरावलोकन उघडले.",
        noApproval: "पाहण्यासाठी कोणतीही मंजुरी बाकी नाही.",
        visionStarted: "झोन B मधील झाड 23 साठी पान तपासणी सुरू झाली.",
        visionFailed: "पान तपासणी पूर्ण होऊ शकली नाही.",
        voiceFailed: "शेत सहाय्यक आत्ता उत्तर देऊ शकला नाही.",
        fallback: "डेमो फॉलबॅक सक्रिय आहे."
      }
    },
    metricsPanel: {
      eyebrow: "लाईव्ह मेट्रिक्स",
      title: "ऑपरेशनल तयारी",
      updated: "अपडेट 10:30:25 AM",
      noPriorityBlock: "प्राधान्य विभाग नाही",
      noRobot: "रोबोट नाही",
      soilMoisture: "मातीतील ओलावा",
      needsApproval: (count) => `${count} मंजुरी हवी`,
      points: "गुण",
      cards: {
        mangoTrees: { label: "आंब्याची झाडे", value: "564", helper: "4 विभाग जोडले" },
        priorityBlock: { label: "प्राधान्य विभाग", helper: "24% मातीतील ओलावा" },
        robot: { label: "Robot R1", helper: "कॅलिब्रेट मार्गावर" },
        tankLevel: { label: "टाकी पातळी", value: "65%", helper: "2 चक्रांसाठी पुरेसे" },
        openAlerts: { label: "उघडे अलर्ट", helper: "1 मंजुरी हवी" },
        nextVerify: { label: "पुढील पडताळणी", value: "10 मिनिटे", helper: "Outcome Agent नियोजित" }
      }
    },
    evaluationsPanel: {
      eyebrow: "एजंट मूल्यांकन",
      title: "गुणवत्ता, खर्च, पुनरावलोकन जोखीम",
      quality: "गुणवत्ता",
      confidence: "विश्वास",
      latency: "विलंब",
      cost: "खर्च",
      excellent: "उत्कृष्ट",
      high: "उच्च",
      endToEnd: "सुरुवात ते शेवट",
      demoRun: "डेमो रन",
      reviewGate: (zoneName) =>
        `उच्च-जोखीम किंवा कमी-विश्वास कृती पुनरावलोकनात राहतात. सध्याचे पुनरावलोकन गेट: ${zoneName} उपचार मंजुरी.`,
      none: "काही नाही"
    },
    actionsPanel: {
      eyebrow: "स्वयंचलित कृती",
      title: "Planner रांग आणि मानवी पुनरावलोकन",
      fallbackQueue: [
        {
          title: "ड्रिप सिंचन रांगेत",
          detail: "झोन B - संध्याकाळी 7:00 वाजता 12 मिनिटे",
          status: "नियोजित",
          tone: "success"
        },
        {
          title: "रोबोट तपासणी दिली",
          detail: "R1 मार्ग: गेट 1 -> झोन B -> झाड 23 -> टाकी बे",
          status: "सक्रिय",
          tone: "info"
        },
        {
          title: "उपचार पुनरावलोकन",
          detail: "बुरशीचा संभाव्य धोका. फवारणीपूर्वी शेतकऱ्याची मंजुरी आवश्यक.",
          status: "मंजुरी",
          tone: "warning"
        },
        {
          title: "परिणाम पडताळणी",
          detail: "फॉलो-अप टेलिमेट्रीशी ओलावा बेसलाइन तुलना करा.",
          status: "प्रतीक्षा",
          tone: "info"
        }
      ],
      actionTypes: {
        schedule_irrigation: "ड्रिप सिंचन रांगेत",
        robot_inspection: "रोबोट तपासणी दिली",
        farmer_voice_brief: "शेतकरी आवाज अहवाल",
        verify_outcome: "परिणाम पडताळणी",
        treatment_review: "उपचार पुनरावलोकन"
      }
    },
    communicationPanel: {
      eyebrow: "कम्युनिकेशन गेटवे",
      title: "एस्कलेशन आणि डिलिव्हरी",
      channels: {
        in_app: { label: "अ‍ॅपमध्ये", status: "ऑनलाइन" },
        whatsapp: { label: "WhatsApp", status: "प्राधान्य" },
        telegram: { label: "Telegram", status: "बॅकअप" },
        sms: { label: "SMS", status: "गंभीर" },
        phone_call: { label: "फोन", status: "गंभीर" }
      }
    },
    memoryPanel: {
      eyebrow: "स्मृती आणि परिणाम",
      title: "फार्म जर्नल",
      outcomeAgent: "Outcome Agent",
      baseline: (zoneName) =>
        `${zoneName} मधील बेसलाइन ओलावा साठवला आहे. सिंचन उपयोगी ठरले का हे फॉलो-अप टेलिमेट्री पडताळेल.`,
      priorityZone: "प्राधान्य विभाग",
      events: [
        "शेवटच्या लहान सिंचन चक्रानंतर झोन B मध्ये 14 गुणांनी सुधारणा झाली.",
        "टाकी पातळी 55% खाली गेल्यावर केसर विभागात पुन्हा ताण दिसला.",
        "शेतकऱ्याला मराठी आवाज अहवाल आणि WhatsApp मंजुरी लिंक पसंत आहेत.",
        "मागील बुरशी अलर्ट रोबोट क्लोज-अपनंतर कमी जोखीम ठरला."
      ]
    },
    footer: {
      backend: "बॅकेंड",
      connectedSensors: "जोडलेले सेन्सर",
      activeRobot: "सक्रिय रोबोट",
      pendingAlerts: "प्रलंबित अलर्ट"
    },
    common: {
      none: "काही नाही",
      fallbackData: "फॉलबॅक डेटा",
      farmAdmin: "शेत प्रशासक",
      server: "सर्व्हर",
      system: "सिस्टम",
      syncingTime: "वेळ समक्रमित करत आहे"
    },
    statuses: {
      completed: "पूर्ण",
      queued: "रांगेत",
      fallback: "फॉलबॅक",
      review: "पुनरावलोकन",
      scheduled: "नियोजित",
      active: "सक्रिय",
      approval: "मंजुरी",
      waiting: "प्रतीक्षा",
      recommended: "शिफारस",
      needs_approval: "मंजुरी हवी",
      pending_verification: "पडताळणी बाकी",
      verified: "पडताळले",
      failed: "अयशस्वी",
      online: "ऑनलाइन",
      preferred: "प्राधान्य",
      backup: "बॅकअप",
      critical: "गंभीर",
      simulated: "सिम्युलेटेड",
      sent: "पाठवले",
      delivered: "पोचले",
      successful: "यशस्वी",
      partial: "आंशिक",
      ready: "तयार"
    },
    robotStatuses: {
      available: "उपलब्ध",
      assigned: "नियुक्त",
      charging: "चार्जिंग",
      offline: "ऑफलाइन"
    },
    knownText: {
      "Checking backend health...": "बॅकेंड आरोग्य तपासत आहे...",
      "Routed Zone B mango moisture anomaly into the sensor anomaly workflow.":
        "झोन B आंबा ओलावा विसंगती सेन्सर विसंगती वर्कफ्लोमध्ये पाठवली.",
      "Supervisor routed the event into the correct AgriOS workflow.":
        "Supervisor ने इव्हेंट योग्य AgriOS वर्कफ्लोमध्ये पाठवला.",
      "Zone B soil moisture is low at 24% with rising canopy temperature.":
        "झोन B मध्ये मातीतील ओलावा 24% कमी आहे आणि कॅनोपी तापमान वाढत आहे.",
      "Mock forecast shows no heavy rain in the next 6 hours.":
        "मॉक अंदाजानुसार पुढील 6 तासांत मोठा पाऊस नाही.",
      "Leaf image from Tree 23 shows possible early fungal marks.":
        "झाड 23 च्या पानाच्या प्रतिमेत सुरुवातीचे बुरशीचे डाग दिसू शकतात.",
      "Possible early blight detected on the demo leaf image.":
        "डेमो पानाच्या प्रतिमेत संभाव्य सुरुवातीचा ब्लाइट आढळला.",
      "Water stress is high; treatment risk requires farmer review.":
        "पाण्याचा ताण जास्त आहे; उपचार जोखमीसाठी शेतकऱ्याचे पुनरावलोकन आवश्यक.",
      "Water stress is high; treatment decisions require farmer review.":
        "पाण्याचा ताण जास्त आहे; उपचार निर्णयासाठी शेतकऱ्याचे पुनरावलोकन आवश्यक.",
      "Zone B water stress is high and should be acted on.":
        "झोन B मध्ये पाण्याचा ताण जास्त आहे आणि कृती आवश्यक आहे.",
      "Scheduled drip irrigation, robot inspection, communication, and outcome verification.":
        "ड्रिप सिंचन, रोबोट तपासणी, संवाद आणि परिणाम पडताळणी नियोजित केली.",
      "Scheduled irrigation, robot inspection, communication, and outcome verification.":
        "सिंचन, रोबोट तपासणी, संवाद आणि परिणाम पडताळणी नियोजित केली.",
      "Robot R1 assigned to Gate 1 -> Zone B -> Tree 23 -> Tank bay route.":
        "Robot R1 ला गेट 1 -> झोन B -> झाड 23 -> टाकी बे मार्ग दिला.",
      "Robot R1 remains available for inspection.": "Robot R1 तपासणीसाठी उपलब्ध आहे.",
      "Farmer notification simulated through WhatsApp with SMS and phone escalation ready.":
        "SMS आणि फोन एस्कलेशन तयार ठेवून WhatsApp वर शेतकरी सूचना सिम्युलेट केली.",
      "Stored Zone B moisture baseline and scheduled follow-up telemetry comparison.":
        "झोन B ओलावा बेसलाइन साठवली आणि फॉलो-अप टेलिमेट्री तुलना नियोजित केली.",
      "Stored Zone B moisture baseline and verified simulated follow-up telemetry.":
        "झोन B ओलावा बेसलाइन साठवली आणि सिम्युलेटेड फॉलो-अप टेलिमेट्री पडताळली.",
      "Workflow quality is high; one human-review gate is correctly preserved.":
        "वर्कफ्लो गुणवत्ता उच्च आहे; एक मानवी पुनरावलोकन गेट योग्यरित्या ठेवले आहे.",
      "Workflow quality is high; human-review gates are visible.":
        "वर्कफ्लो गुणवत्ता उच्च आहे; मानवी पुनरावलोकन गेट दिसत आहेत.",
      "Wrote farm journal entry for Zone B moisture stress, robot route, and farmer approval.":
        "झोन B ओलावा ताण, रोबोट मार्ग आणि शेतकरी मंजुरीसाठी फार्म जर्नल नोंद लिहिली.",
      "Wrote farm journal entry for the latest workflow.":
        "नवीनतम वर्कफ्लोसाठी फार्म जर्नल नोंद लिहिली.",
      "Voice prompt received and normalized for farm-state lookup.":
        "Voice प्रॉम्प्ट मिळाला आणि फार्म-स्थिती शोधासाठी सामान्य केला.",
      "Farm status response generated with text fallback.":
        "टेक्स्ट फॉलबॅकने फार्म स्थिती उत्तर तयार केले.",
      "Voice Agent retrieved recent risks, scheduled actions, pending approvals, and outcomes.":
        "Voice Agent ने अलीकडील धोके, नियोजित कृती, प्रलंबित मंजुरी आणि परिणाम मिळवले.",
      "12 minute drip irrigation scheduled for Zone B.":
        "झोन B साठी 12 मिनिटांचे ड्रिप सिंचन नियोजित.",
      "Robot R1 assigned to inspect Tree 23 for water stress and leaf marks.":
        "पाण्याचा ताण आणि पानावरील खुणांसाठी झाड 23 तपासण्याचे काम Robot R1 ला दिले.",
      "Robot R1 assigned to inspect Tree 23 and the Zone B drip line.":
        "झाड 23 आणि झोन B ड्रिप लाईन तपासण्याचे काम Robot R1 ला दिले.",
      "Marathi voice brief prepared for the farmer.": "शेतकऱ्यासाठी मराठी आवाज अहवाल तयार.",
      "Outcome Agent will compare follow-up telemetry after irrigation.":
        "सिंचनानंतर Outcome Agent फॉलो-अप टेलिमेट्रीची तुलना करेल.",
      "Possible fungal treatment is held for farmer approval before spraying.":
        "फवारणीपूर्वी संभाव्य बुरशी उपचार शेतकरी मंजुरीसाठी थांबवला आहे.",
      "Vision Agent found possible early fungal marks. Spraying requires farmer approval.":
        "Vision Agent ला संभाव्य सुरुवातीचे बुरशीचे डाग दिसले. फवारणीसाठी शेतकरी मंजुरी आवश्यक.",
      "Fungal treatment review": "बुरशी उपचार पुनरावलोकन",
      "Zone B improved by 14 points after the last short irrigation cycle.":
        "शेवटच्या लहान सिंचन चक्रानंतर झोन B मध्ये 14 गुणांनी सुधारणा झाली.",
      "Kesar block showed repeat stress when tank level dropped below 55%.":
        "टाकी पातळी 55% खाली गेल्यावर केसर विभागात पुन्हा ताण दिसला.",
      "Farmer prefers Marathi voice brief and WhatsApp approval links.":
        "शेतकऱ्याला मराठी आवाज अहवाल आणि WhatsApp मंजुरी लिंक पसंत आहेत.",
      "Farmer prefers Marathi voice briefs and WhatsApp approval links.":
        "शेतकऱ्याला मराठी आवाज अहवाल आणि WhatsApp मंजुरी लिंक पसंत आहेत.",
      "Previous fungal alert was downgraded after robot close-up review.":
        "मागील बुरशी अलर्ट रोबोट क्लोज-अपनंतर कमी जोखीम ठरला.",
      "Recorded low moisture, scheduled irrigation, simulated farmer alert, and verified outcome.":
        "कमी ओलावा नोंदवला, सिंचन नियोजित केले, शेतकरी अलर्ट सिम्युलेट केला आणि परिणाम पडताळला.",
      "Recorded fallback leaf analysis, robot inspection, and treatment approval request.":
        "फॉलबॅक पान विश्लेषण, रोबोट तपासणी आणि उपचार मंजुरी विनंती नोंदवली.",
      "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.":
        "झोन B मधील ओलावा अत्यंत कमी आहे. लहान सिंचन नियोजित आहे आणि 10 मिनिटांत पडताळले जाईल.",
      "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.":
        "झोन B कोरडा आहे, सिंचन नियोजित आहे, Robot R1 पिकाची तपासणी करत आहे आणि पुढील 6 तासांत मोठ्या पावसाची शक्यता नाही.",
      "Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe, Robot R1 tapasnisathi Zone B madhye aahe, ani pudhchya 6 tasat motha paus expected nahi.":
        "झोन B कोरडा आहे, सिंचन नियोजित आहे, Robot R1 पिकाची तपासणी करत आहे आणि पुढील 6 तासांत मोठ्या पावसाची शक्यता नाही."
    },
    patterns: {
      sensorCritical: (moisture) => `झोन B मध्ये मातीतील ओलावा गंभीरपणे कमी, ${moisture}% आहे.`,
      outcomeMoisture: (before, after) => `सिंचनानंतर झोन B ओलावा ${before}% वरून ${after}% झाला.`
    }
  },
  hi: {
    language: {
      label: "हिन्दी",
      shortLabel: "HI",
      farmerBrief:
        "जोन B में मिट्टी की नमी कम है। ड्रिप सिंचाई कतार में है, Robot R1 पेड़ 23 की जांच कर रहा है और उपचार के लिए आपकी मंजूरी बाकी है।",
      voicePrompt: "मेरे खेत की आज की आम बागान स्थिति बताएं।",
      voiceResponse:
        "जोन B सूखा है, सिंचाई निर्धारित है, Robot R1 फसल की जांच कर रहा है और अगले 6 घंटों में भारी बारिश की उम्मीद नहीं है।",
      escalation: "चेतावनी WhatsApp पर भेजें; गंभीर स्थिति में SMS और फोन कॉल से फॉलो-अप करें।"
    },
    farmNames: {
      "Ratnagiri Mango Estate": "रत्नागिरी आम एस्टेट"
    },
    zoneNames: {
      "Zone A": "जोन A",
      "Zone B": "जोन B",
      "Zone C": "जोन C",
      "Zone D": "जोन D"
    },
    header: {
      subtitle: "स्वचालित आम फार्म कमांड सेंटर",
      farmDescription: (farmName) =>
        `${farmName} में सेक्शन लेआउट, रोबोट रूट, ड्रिप वाल्व, सेंसर मेष, वॉइस, विजन और कम्युनिकेशन गेटवे जोड़े गए हैं।`,
      forecast: "28°C मौसम अनुमान",
      localTime: "10:30 AM IST",
      languageLabel: "भाषा",
      selectLanguageAria: "किसान की भाषा चुनें",
      farmAdmin: "फार्म व्यवस्थापक"
    },
    statusSummary: {
      loading: "बैकएंड जांच रहा है",
      ok: "लाइव बैकएंड जुड़ा है",
      error: "डेमो फॉलबैक सक्रिय"
    },
    workflowMessages: {
      initial: "उपलब्ध होने पर बैकएंड वर्कफ्लो डेटा मॉक डेटा की जगह दिखेगा।",
      loaded: (workflow) => `बैकएंड से ${workflow} वर्कफ्लो लोड हुआ।`,
      fallback: (message) => `स्थानीय फॉलबैक डेटा इस्तेमाल हो रहा है: ${message}`,
      runningVision: "Vision Agent फॉलबैक वर्कफ्लो चला रहा है...",
      runningVoice: "फार्म मैनेजर को कॉल किया जा रहा है...",
      visionFailed: "Vision वर्कफ्लो असफल रहा।",
      voiceFailed: "Voice वर्कफ्लो असफल रहा।"
    },
    map: {
      eyebrow: "फार्म नक्शा",
      title: "आम सेक्शन, सेंसर, रोबोट पथ",
      action: "लाइव लेआउट पंजीकृत",
      imageAlt: "चार फार्म सेक्शन और पानी की टंकी वाला ऊपर से दिखता आम बागान नक्शा",
      mango: "आम",
      trees: "पेड़",
      sensors: "सेंसर",
      valve: "वाल्व",
      robot: "रोबोट 78%",
      leafScan: "पत्ती स्कैन",
      tank: "टंकी 65%",
      gate: "गेट",
      mangoBlock: "आम सेक्शन",
      calibratedPath: "कैलिब्रेट पथ",
      controls: {
        zoomIn: "ज़ूम इन",
        zoomOut: "ज़ूम आउट",
        center: "नक्शा केंद्रित करें",
        centerShort: "केंद्र"
      },
      legend: {
        sensors: "सेंसर",
        robot: "रोबोट",
        dripValves: "ड्रिप वाल्व",
        waterTank: "पानी की टंकी",
        mangoBlocks: "आम सेक्शन",
        pathCalibrated: "पथ कैलिब्रेट"
      },
      orchard: {
        "zone-a": { variety: "अल्फांसो", activeIssue: "स्वस्थ छत्र" },
        "zone-b": { variety: "केसर", activeIssue: "पानी का तनाव" },
        "zone-c": { variety: "दशहरी", activeIssue: "पत्ती धब्बा निगरानी" },
        "zone-d": { variety: "नए ग्राफ्ट", activeIssue: "स्थिर" }
      }
    },
    riskLabels: {
      critical: "गंभीर",
      high: "ध्यान दें",
      medium: "निगरानी",
      low: "स्वस्थ"
    },
    agentTimeline: {
      title: "एजेंट निष्पादन टाइमलाइन",
      review: "समीक्षा",
      confidence: "विश्वास",
      ms: "मि.से.",
      workflows: {
        sensor_anomaly: "सेंसर विसंगति",
        vision: "विजन",
        voice: "वॉइस",
        outcome_verification: "परिणाम सत्यापन"
      },
      agents: {
        supervisor: "Supervisor Agent",
        sensor: "Sensor Agent",
        weather: "Weather Agent",
        vision: "Vision Agent",
        risk: "Risk Agent",
        planner: "Planner Agent",
        robot: "Robot Agent",
        communication: "AgriOS Saathi",
        outcome: "Outcome Agent",
        evaluation: "Evaluation Agent",
        memory: "Memory Agent",
        voice: "Voice Agent"
      }
    },
    touchpointsPanel: {
      eyebrow: "किसान संपर्क",
      title: "भाषा, अलर्ट, मंजूरी",
      selectedLanguage: "चुनी गई भाषा",
      analyzeLeaf: "पत्ती जांचें",
      callMyFarm: "मेरे खेत को कॉल करें",
      touchpoints: [
        {
          title: "मेरे खेत को कॉल करें",
          detail: "Voice Agent सक्रिय जोखिम, कार्रवाई, मंजूरी और सत्यापित परिणाम बता सकता है।",
          status: "तैयार",
          tone: "success"
        },
        {
          title: "मंजूरी इनबॉक्स",
          detail: "उच्च-जोखिम स्प्रे उपचार किसान की मंजूरी तक रुका है।",
          status: "1 बाकी",
          tone: "warning"
        },
        {
          title: "पत्ती कैप्चर",
          detail: "Vision वर्कफ्लो जोन B के पेड़ 23 से जुड़ा है।",
          status: "फॉलबैक सुरक्षित",
          tone: "info"
        },
        {
          title: "कम्युनिकेशन गेटवे",
          detail: "WhatsApp प्राथमिक, Telegram बैकअप, गंभीर अलर्ट के लिए SMS और फोन।",
          status: "सिम्युलेटेड",
          tone: "success"
        }
      ]
    },
    conversationPanel: {
      launcherLabel: "AgriOS से पूछें",
      title: "AgriOS फार्म सहायक",
      subtitle: "किसान संवाद",
      assistantName: "AgriOS Saathi",
      farmerLabel: "किसान",
      systemLabel: "सिस्टम",
      closeLabel: "बंद",
      inputPlaceholder: "अपने खेत के बारे में AgriOS को संदेश भेजें",
      sendLabel: "भेजें",
      ready: "तैयार",
      running: "जांच रहा है",
      liveAi: "लाइव AI",
      demoFallback: "डेमो फॉलबैक",
      callSignLabel: "कॉल साइन",
      liveCall: "लाइव कॉल",
      callReady: "तैयार",
      callActive: "कॉल पर",
      connectingCall: "कनेक्ट हो रहा है",
      fallbackCall: "रिकॉर्डिंग फॉलबैक",
      fallbackRecording: "रिकॉर्डिंग फॉलबैक सक्रिय है।",
      liveCallUnavailable: "लाइव AI कॉल उपलब्ध नहीं है।",
      startCall: "कॉल शुरू करें",
      endCall: "कॉल खत्म करें",
      liveCallPrompt: (callSign) => `लाइव कॉल ${callSign}`,
      audioReply: "ऑडियो जवाब",
      recordLabel: "रिकॉर्ड",
      stopRecording: "रोकें",
      recording: "किसान संदेश रिकॉर्ड हो रहा है",
      attachAudio: "ऑडियो जोड़ें",
      farmerAudio: "किसान ऑडियो",
      audioPrompt: "आवाज संदेश",
      typing: "AgriOS खेत की स्थिति जांच रहा है...",
      micUnavailable: "इस ब्राउजर में माइक्रोफोन उपलब्ध नहीं है।",
      quickActions: {
        today: "आज की स्थिति",
        approvals: "मंजूरी",
        risk: "जोन जोखिम",
        robot: "Robot R1",
        outcome: "परिणाम",
        communication: "संदेश",
        analyzeLeaf: "पत्ती जांचें",
        reviewApproval: "मंजूरी देखें"
      },
      prompts: {
        today: "मेरे खेत की आज की आम बागान स्थिति बताएं।",
        approvals: "अभी किन चीजों को मंजूरी चाहिए?",
        risk: (zoneName) => `${zoneName} में जोखिम क्यों है?`,
        robot: "Robot R1 अभी कहां है?",
        outcome: "क्या सिंचाई काम आई?",
        communication: "किसान को कौन से संदेश भेजे गए?"
      },
      context: {
        priority: "प्राथमिकता",
        approvals: "मंजूरी",
        robot: "रोबोट",
        outcome: "परिणाम",
        tank: "टंकी",
        communication: "संदेश",
        noPriority: "स्थिर",
        noApprovals: "कुछ बाकी नहीं",
        noRobot: "रोबोट नहीं",
        noOutcome: "प्रतीक्षा",
        noCommunication: "अभी कोई संदेश नहीं"
      },
      system: {
        languageChanged: (languageName) => `आगे के जवाब ${languageName} में आएंगे।`,
        reviewOpened: "Farm Admin में मंजूरी समीक्षा खुली है।",
        noApproval: "देखने के लिए कोई लंबित मंजूरी नहीं है।",
        visionStarted: "जोन B के पेड़ 23 के लिए पत्ती जांच शुरू हुई।",
        visionFailed: "पत्ती जांच पूरी नहीं हो सकी।",
        voiceFailed: "फार्म सहायक अभी जवाब नहीं दे सका।",
        fallback: "डेमो फॉलबैक सक्रिय है।"
      }
    },
    metricsPanel: {
      eyebrow: "लाइव मेट्रिक्स",
      title: "ऑपरेशनल तैयारी",
      updated: "अपडेट 10:30:25 AM",
      noPriorityBlock: "कोई प्राथमिक सेक्शन नहीं",
      noRobot: "कोई रोबोट नहीं",
      soilMoisture: "मिट्टी की नमी",
      needsApproval: (count) => `${count} मंजूरी चाहिए`,
      points: "अंक",
      cards: {
        mangoTrees: { label: "आम के पेड़", value: "564", helper: "4 सेक्शन जोड़े गए" },
        priorityBlock: { label: "प्राथमिक सेक्शन", helper: "24% मिट्टी की नमी" },
        robot: { label: "Robot R1", helper: "कैलिब्रेट पथ पर" },
        tankLevel: { label: "टंकी स्तर", value: "65%", helper: "2 चक्रों के लिए पर्याप्त" },
        openAlerts: { label: "खुले अलर्ट", helper: "1 मंजूरी चाहिए" },
        nextVerify: { label: "अगला सत्यापन", value: "10 मिनट", helper: "Outcome Agent निर्धारित" }
      }
    },
    evaluationsPanel: {
      eyebrow: "एजेंट मूल्यांकन",
      title: "गुणवत्ता, लागत, समीक्षा जोखिम",
      quality: "गुणवत्ता",
      confidence: "विश्वास",
      latency: "विलंब",
      cost: "लागत",
      excellent: "उत्कृष्ट",
      high: "उच्च",
      endToEnd: "एंड टू एंड",
      demoRun: "डेमो रन",
      reviewGate: (zoneName) =>
        `उच्च-जोखिम या कम-विश्वास कार्रवाई समीक्षा योग्य रहती है। वर्तमान समीक्षा गेट: ${zoneName} उपचार मंजूरी।`,
      none: "कुछ नहीं"
    },
    actionsPanel: {
      eyebrow: "स्वायत्त कार्रवाई",
      title: "Planner कतार और मानव समीक्षा",
      fallbackQueue: [
        {
          title: "ड्रिप सिंचाई कतार में",
          detail: "जोन B - शाम 7:00 बजे 12 मिनट",
          status: "निर्धारित",
          tone: "success"
        },
        {
          title: "रोबोट जांच सौंपी गई",
          detail: "R1 मार्ग: गेट 1 -> जोन B -> पेड़ 23 -> टंकी बे",
          status: "सक्रिय",
          tone: "info"
        },
        {
          title: "उपचार समीक्षा",
          detail: "संभावित फंगल जोखिम। स्प्रे से पहले किसान की मंजूरी चाहिए।",
          status: "मंजूरी",
          tone: "warning"
        },
        {
          title: "परिणाम सत्यापन",
          detail: "फॉलो-अप टेलिमेट्री से नमी बेसलाइन की तुलना करें।",
          status: "प्रतीक्षा",
          tone: "info"
        }
      ],
      actionTypes: {
        schedule_irrigation: "ड्रिप सिंचाई कतार में",
        robot_inspection: "रोबोट जांच सौंपी गई",
        farmer_voice_brief: "किसान वॉइस ब्रीफ",
        verify_outcome: "परिणाम सत्यापन",
        treatment_review: "उपचार समीक्षा"
      }
    },
    communicationPanel: {
      eyebrow: "कम्युनिकेशन गेटवे",
      title: "एस्कलेशन और डिलिवरी",
      channels: {
        in_app: { label: "इन-ऐप", status: "ऑनलाइन" },
        whatsapp: { label: "WhatsApp", status: "प्राथमिक" },
        telegram: { label: "Telegram", status: "बैकअप" },
        sms: { label: "SMS", status: "गंभीर" },
        phone_call: { label: "फोन", status: "गंभीर" }
      }
    },
    memoryPanel: {
      eyebrow: "मेमोरी और परिणाम",
      title: "फार्म जर्नल",
      outcomeAgent: "Outcome Agent",
      baseline: (zoneName) =>
        `${zoneName} में बेसलाइन नमी सहेजी गई है। सिंचाई काम आई या नहीं, फॉलो-अप टेलिमेट्री सत्यापित करेगी।`,
      priorityZone: "प्राथमिक सेक्शन",
      events: [
        "पिछले छोटे सिंचाई चक्र के बाद जोन B में 14 अंक सुधार हुआ।",
        "टंकी स्तर 55% से नीचे गया तो केसर सेक्शन में फिर तनाव दिखा।",
        "किसान को मराठी वॉइस ब्रीफ और WhatsApp मंजूरी लिंक पसंद हैं।",
        "पिछला फंगल अलर्ट रोबोट क्लोज-अप समीक्षा के बाद कम जोखिम हुआ।"
      ]
    },
    footer: {
      backend: "बैकएंड",
      connectedSensors: "जुड़े सेंसर",
      activeRobot: "सक्रिय रोबोट",
      pendingAlerts: "बाकी अलर्ट"
    },
    common: {
      none: "कुछ नहीं",
      fallbackData: "फॉलबैक डेटा",
      farmAdmin: "फार्म व्यवस्थापक",
      server: "सर्वर",
      system: "सिस्टम",
      syncingTime: "समय सिंक हो रहा है"
    },
    statuses: {
      completed: "पूर्ण",
      queued: "कतार में",
      fallback: "फॉलबैक",
      review: "समीक्षा",
      scheduled: "निर्धारित",
      active: "सक्रिय",
      approval: "मंजूरी",
      waiting: "प्रतीक्षा",
      recommended: "अनुशंसित",
      needs_approval: "मंजूरी चाहिए",
      pending_verification: "सत्यापन बाकी",
      verified: "सत्यापित",
      failed: "असफल",
      online: "ऑनलाइन",
      preferred: "प्राथमिक",
      backup: "बैकअप",
      critical: "गंभीर",
      simulated: "सिम्युलेटेड",
      sent: "भेजा गया",
      delivered: "डिलिवर",
      successful: "सफल",
      partial: "आंशिक",
      ready: "तैयार"
    },
    robotStatuses: {
      available: "उपलब्ध",
      assigned: "सौंपा गया",
      charging: "चार्ज हो रहा",
      offline: "ऑफलाइन"
    },
    knownText: {
      "Checking backend health...": "बैकएंड स्वास्थ्य जांच रहा है...",
      "Routed Zone B mango moisture anomaly into the sensor anomaly workflow.":
        "जोन B आम नमी विसंगति सेंसर विसंगति वर्कफ्लो में भेजी गई।",
      "Supervisor routed the event into the correct AgriOS workflow.":
        "Supervisor ने इवेंट को सही AgriOS वर्कफ्लो में भेजा।",
      "Zone B soil moisture is low at 24% with rising canopy temperature.":
        "जोन B में मिट्टी की नमी 24% कम है और कैनोपी तापमान बढ़ रहा है।",
      "Mock forecast shows no heavy rain in the next 6 hours.":
        "मॉक अनुमान के अनुसार अगले 6 घंटों में भारी बारिश नहीं है।",
      "Leaf image from Tree 23 shows possible early fungal marks.":
        "पेड़ 23 की पत्ती छवि में शुरुआती फंगल निशान दिख सकते हैं।",
      "Possible early blight detected on the demo leaf image.":
        "डेमो पत्ती छवि में संभावित शुरुआती ब्लाइट मिला।",
      "Water stress is high; treatment risk requires farmer review.":
        "पानी का तनाव उच्च है; उपचार जोखिम के लिए किसान समीक्षा चाहिए।",
      "Water stress is high; treatment decisions require farmer review.":
        "पानी का तनाव उच्च है; उपचार निर्णय के लिए किसान समीक्षा चाहिए।",
      "Zone B water stress is high and should be acted on.":
        "जोन B में पानी का तनाव उच्च है और कार्रवाई जरूरी है।",
      "Scheduled drip irrigation, robot inspection, communication, and outcome verification.":
        "ड्रिप सिंचाई, रोबोट जांच, संवाद और परिणाम सत्यापन निर्धारित किए गए।",
      "Scheduled irrigation, robot inspection, communication, and outcome verification.":
        "सिंचाई, रोबोट जांच, संवाद और परिणाम सत्यापन निर्धारित किए गए।",
      "Robot R1 assigned to Gate 1 -> Zone B -> Tree 23 -> Tank bay route.":
        "Robot R1 को गेट 1 -> जोन B -> पेड़ 23 -> टंकी बे मार्ग दिया गया।",
      "Robot R1 remains available for inspection.": "Robot R1 जांच के लिए उपलब्ध है।",
      "Farmer notification simulated through WhatsApp with SMS and phone escalation ready.":
        "SMS और फोन एस्कलेशन तैयार रखते हुए WhatsApp पर किसान सूचना सिम्युलेट की गई।",
      "Stored Zone B moisture baseline and scheduled follow-up telemetry comparison.":
        "जोन B नमी बेसलाइन सहेजी गई और फॉलो-अप टेलिमेट्री तुलना निर्धारित हुई।",
      "Stored Zone B moisture baseline and verified simulated follow-up telemetry.":
        "जोन B नमी बेसलाइन सहेजी गई और सिम्युलेटेड फॉलो-अप टेलिमेट्री सत्यापित हुई।",
      "Workflow quality is high; one human-review gate is correctly preserved.":
        "वर्कफ्लो गुणवत्ता उच्च है; एक मानव समीक्षा गेट सही रखा गया है।",
      "Workflow quality is high; human-review gates are visible.":
        "वर्कफ्लो गुणवत्ता उच्च है; मानव समीक्षा गेट दिखाई दे रहे हैं।",
      "Wrote farm journal entry for Zone B moisture stress, robot route, and farmer approval.":
        "जोन B नमी तनाव, रोबोट मार्ग और किसान मंजूरी के लिए फार्म जर्नल प्रविष्टि लिखी।",
      "Wrote farm journal entry for the latest workflow.":
        "नवीनतम वर्कफ्लो के लिए फार्म जर्नल प्रविष्टि लिखी।",
      "Voice prompt received and normalized for farm-state lookup.":
        "Voice प्रॉम्प्ट मिला और फार्म-स्थिति लुकअप के लिए सामान्य किया गया।",
      "Farm status response generated with text fallback.":
        "टेक्स्ट फॉलबैक से फार्म स्थिति उत्तर बनाया गया।",
      "Voice Agent retrieved recent risks, scheduled actions, pending approvals, and outcomes.":
        "Voice Agent ने हाल के जोखिम, निर्धारित कार्रवाई, बाकी मंजूरी और परिणाम निकाले।",
      "12 minute drip irrigation scheduled for Zone B.":
        "जोन B के लिए 12 मिनट की ड्रिप सिंचाई निर्धारित।",
      "Robot R1 assigned to inspect Tree 23 for water stress and leaf marks.":
        "पानी के तनाव और पत्ती निशानों के लिए पेड़ 23 की जांच Robot R1 को दी गई।",
      "Robot R1 assigned to inspect Tree 23 and the Zone B drip line.":
        "पेड़ 23 और जोन B ड्रिप लाइन की जांच Robot R1 को दी गई।",
      "Marathi voice brief prepared for the farmer.": "किसान के लिए मराठी वॉइस ब्रीफ तैयार।",
      "Outcome Agent will compare follow-up telemetry after irrigation.":
        "सिंचाई के बाद Outcome Agent फॉलो-अप टेलिमेट्री की तुलना करेगा।",
      "Possible fungal treatment is held for farmer approval before spraying.":
        "स्प्रे से पहले संभावित फंगल उपचार किसान मंजूरी के लिए रोका गया है।",
      "Vision Agent found possible early fungal marks. Spraying requires farmer approval.":
        "Vision Agent को संभावित शुरुआती फंगल निशान मिले। स्प्रे के लिए किसान मंजूरी चाहिए।",
      "Fungal treatment review": "फंगल उपचार समीक्षा",
      "Zone B improved by 14 points after the last short irrigation cycle.":
        "पिछले छोटे सिंचाई चक्र के बाद जोन B में 14 अंक सुधार हुआ।",
      "Kesar block showed repeat stress when tank level dropped below 55%.":
        "टंकी स्तर 55% से नीचे गया तो केसर सेक्शन में फिर तनाव दिखा।",
      "Farmer prefers Marathi voice brief and WhatsApp approval links.":
        "किसान को मराठी वॉइस ब्रीफ और WhatsApp मंजूरी लिंक पसंद हैं।",
      "Farmer prefers Marathi voice briefs and WhatsApp approval links.":
        "किसान को मराठी वॉइस ब्रीफ और WhatsApp मंजूरी लिंक पसंद हैं।",
      "Previous fungal alert was downgraded after robot close-up review.":
        "पिछला फंगल अलर्ट रोबोट क्लोज-अप समीक्षा के बाद कम जोखिम हुआ।",
      "Recorded low moisture, scheduled irrigation, simulated farmer alert, and verified outcome.":
        "कम नमी दर्ज की, सिंचाई निर्धारित की, किसान अलर्ट सिम्युलेट किया और परिणाम सत्यापित किया।",
      "Recorded fallback leaf analysis, robot inspection, and treatment approval request.":
        "फॉलबैक पत्ती विश्लेषण, रोबोट जांच और उपचार मंजूरी अनुरोध दर्ज किया।",
      "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.":
        "जोन B की नमी गंभीर रूप से कम है। छोटी सिंचाई निर्धारित है और 10 मिनट में सत्यापित होगी।",
      "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.":
        "जोन B सूखा है, सिंचाई निर्धारित है, Robot R1 फसल की जांच कर रहा है और अगले 6 घंटों में भारी बारिश की उम्मीद नहीं है।",
      "Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe, Robot R1 tapasnisathi Zone B madhye aahe, ani pudhchya 6 tasat motha paus expected nahi.":
        "जोन B सूखा है, सिंचाई निर्धारित है, Robot R1 फसल की जांच कर रहा है और अगले 6 घंटों में भारी बारिश की उम्मीद नहीं है।"
    },
    patterns: {
      sensorCritical: (moisture) => `जोन B में मिट्टी की नमी गंभीर रूप से कम, ${moisture}% है।`,
      outcomeMoisture: (before, after) => `सिंचाई के बाद जोन B की नमी ${before}% से ${after}% हुई।`
    }
  },
  gu: {
    language: {
      label: "ગુજરાતી",
      shortLabel: "GU",
      farmerBrief:
        "ઝોન B માં માટીની ભેજ ઓછી છે. ડ્રિપ સિંચાઈ કતારમાં છે, Robot R1 ઝાડ 23 તપાસી રહ્યો છે અને સારવાર માટે તમારી મંજૂરી બાકી છે.",
      voicePrompt: "મારા ખેતરની આજની કેરી બગીચાની સ્થિતિ જણાવો.",
      voiceResponse:
        "ઝોન B સૂકો છે, સિંચાઈ નક્કી છે, Robot R1 પાકની તપાસ કરી રહ્યો છે અને આવતા 6 કલાકમાં ભારે વરસાદની શક્યતા નથી.",
      escalation: "ચેતવણી WhatsApp પર મોકલો; ગંભીર સ્થિતિમાં SMS અને ફોન કોલથી અનુસરો."
    },
    farmNames: {
      "Ratnagiri Mango Estate": "રત્નાગિરી કેરી એસ્ટેટ"
    },
    zoneNames: {
      "Zone A": "ઝોન A",
      "Zone B": "ઝોન B",
      "Zone C": "ઝોન C",
      "Zone D": "ઝોન D"
    },
    header: {
      subtitle: "સ્વચાલિત કેરી ફાર્મ કમાન્ડ સેન્ટર",
      farmDescription: (farmName) =>
        `${farmName} માં વિભાગ લેઆઉટ, રોબોટ માર્ગ, ડ્રિપ વાલ્વ, સેન્સર જાળ, વૉઇસ, વિઝન અને કમ્યુનિકેશન ગેટવે જોડાયેલા છે.`,
      forecast: "28°C હવામાન અંદાજ",
      localTime: "10:30 AM IST",
      languageLabel: "ભાષા",
      selectLanguageAria: "ખેડૂતની ભાષા પસંદ કરો",
      farmAdmin: "ફાર્મ એડમિન"
    },
    statusSummary: {
      loading: "બેકએન્ડ તપાસે છે",
      ok: "લાઇવ બેકએન્ડ જોડાયેલું છે",
      error: "ડેમો ફોલબેક સક્રિય"
    },
    workflowMessages: {
      initial: "ઉપલબ્ધ થાય ત્યારે બેકએન્ડ વર્કફ્લો ડેટા મૉક ડેટાને બદલે દેખાશે.",
      loaded: (workflow) => `બેકએન્ડમાંથી ${workflow} વર્કફ્લો લોડ થયો.`,
      fallback: (message) => `સ્થાનિક ફોલબેક ડેટા વપરાય છે: ${message}`,
      runningVision: "Vision Agent ફોલબેક વર્કફ્લો ચલાવે છે...",
      runningVoice: "ફાર્મ મેનેજરને કોલ કરી રહ્યું છે...",
      visionFailed: "Vision વર્કફ્લો નિષ્ફળ ગયો.",
      voiceFailed: "Voice વર્કફ્લો નિષ્ફળ ગયો."
    },
    map: {
      eyebrow: "ફાર્મ નકશો",
      title: "કેરી વિભાગો, સેન્સર, રોબોટ માર્ગ",
      action: "લાઇવ લેઆઉટ નોંધાયું",
      imageAlt: "ચાર ફાર્મ વિભાગો અને પાણીની ટાંકી ધરાવતો ઉપરથી દેખાતો કેરી બગીચાનો નકશો",
      mango: "કેરી",
      trees: "ઝાડ",
      sensors: "સેન્સર",
      valve: "વાલ્વ",
      robot: "રોબોટ 78%",
      leafScan: "પાન સ્કેન",
      tank: "ટાંકી 65%",
      gate: "ગેટ",
      mangoBlock: "કેરી વિભાગ",
      calibratedPath: "કૅલિબ્રેટ માર્ગ",
      controls: {
        zoomIn: "ઝૂમ ઇન",
        zoomOut: "ઝૂમ આઉટ",
        center: "નકશો મધ્યમાં લાવો",
        centerShort: "મધ્ય"
      },
      legend: {
        sensors: "સેન્સર",
        robot: "રોબોટ",
        dripValves: "ડ્રિપ વાલ્વ",
        waterTank: "પાણીની ટાંકી",
        mangoBlocks: "કેરી વિભાગો",
        pathCalibrated: "માર્ગ કૅલિબ્રેટ"
      },
      orchard: {
        "zone-a": { variety: "અલ્ફોન્સો", activeIssue: "સ્વસ્થ છાંયો" },
        "zone-b": { variety: "કેસર", activeIssue: "પાણીનો તાણ" },
        "zone-c": { variety: "દશહેરી", activeIssue: "પાન ડાઘ નજર" },
        "zone-d": { variety: "નવા કલમ", activeIssue: "સ્થિર" }
      }
    },
    riskLabels: {
      critical: "ગંભીર",
      high: "ધ્યાન આપો",
      medium: "નજર રાખો",
      low: "સ્વસ્થ"
    },
    agentTimeline: {
      title: "એજન્ટ અમલીકરણ સમયરેખા",
      review: "સમીક્ષા",
      confidence: "વિશ્વાસ",
      ms: "મિ.સે.",
      workflows: {
        sensor_anomaly: "સેન્સર વિસંગતિ",
        vision: "વિઝન",
        voice: "વૉઇસ",
        outcome_verification: "પરિણામ ચકાસણી"
      },
      agents: {
        supervisor: "Supervisor Agent",
        sensor: "Sensor Agent",
        weather: "Weather Agent",
        vision: "Vision Agent",
        risk: "Risk Agent",
        planner: "Planner Agent",
        robot: "Robot Agent",
        communication: "AgriOS Saathi",
        outcome: "Outcome Agent",
        evaluation: "Evaluation Agent",
        memory: "Memory Agent",
        voice: "Voice Agent"
      }
    },
    touchpointsPanel: {
      eyebrow: "ખેડૂત સંપર્ક",
      title: "ભાષા, અલર્ટ, મંજૂરી",
      selectedLanguage: "પસંદ કરેલી ભાષા",
      analyzeLeaf: "પાન તપાસો",
      callMyFarm: "મારા ખેતરને કોલ કરો",
      touchpoints: [
        {
          title: "મારા ખેતરને કોલ કરો",
          detail: "Voice Agent સક્રિય જોખમો, પગલાં, મંજૂરીઓ અને ચકાસેલા પરિણામો કહી શકે છે.",
          status: "તૈયાર",
          tone: "success"
        },
        {
          title: "મંજૂરી ઇનબોક્સ",
          detail: "ઉચ્ચ જોખમની છંટકાવ સારવાર ખેડૂતની મંજૂરી સુધી રોકાયેલી છે.",
          status: "1 બાકી",
          tone: "warning"
        },
        {
          title: "પાન કૅપ્ચર",
          detail: "Vision વર્કફ્લો ઝોન B ના ઝાડ 23 સાથે જોડાયેલો છે.",
          status: "ફોલબેક સુરક્ષિત",
          tone: "info"
        },
        {
          title: "કમ્યુનિકેશન ગેટવે",
          detail: "WhatsApp પ્રાથમિક, Telegram બેકઅપ, ગંભીર અલર્ટ માટે SMS અને ફોન.",
          status: "સિમ્યુલેટેડ",
          tone: "success"
        }
      ]
    },
    conversationPanel: {
      launcherLabel: "AgriOS ને પૂછો",
      title: "AgriOS ખેતર સહાયક",
      subtitle: "ખેડૂત સંવાદ",
      assistantName: "AgriOS Saathi",
      farmerLabel: "ખેડૂત",
      systemLabel: "સિસ્ટમ",
      closeLabel: "બંધ",
      inputPlaceholder: "તમારા ખેતર વિશે AgriOS ને સંદેશ મોકલો",
      sendLabel: "મોકલો",
      ready: "તૈયાર",
      running: "તપાસી રહ્યું છે",
      liveAi: "લાઇવ AI",
      demoFallback: "ડેમો ફોલબેક",
      callSignLabel: "કોલ સાઇન",
      liveCall: "લાઇવ કોલ",
      callReady: "તૈયાર",
      callActive: "કોલ ચાલુ",
      connectingCall: "જોડાઈ રહ્યું છે",
      fallbackCall: "રેકોર્ડિંગ ફોલબેક",
      fallbackRecording: "રેકોર્ડિંગ ફોલબેક સક્રિય છે.",
      liveCallUnavailable: "લાઇવ AI કોલ ઉપલબ્ધ નથી.",
      startCall: "કોલ શરૂ કરો",
      endCall: "કોલ સમાપ્ત કરો",
      liveCallPrompt: (callSign) => `લાઇવ કોલ ${callSign}`,
      audioReply: "ઓડિયો જવાબ",
      recordLabel: "રેકોર્ડ",
      stopRecording: "રોકો",
      recording: "ખેડૂત સંદેશ રેકોર્ડ થઈ રહ્યો છે",
      attachAudio: "ઓડિયો જોડો",
      farmerAudio: "ખેડૂત ઓડિયો",
      audioPrompt: "વૉઇસ સંદેશ",
      typing: "AgriOS ખેતરની સ્થિતિ તપાસી રહ્યું છે...",
      micUnavailable: "આ બ્રાઉઝરમાં માઇક્રોફોન ઉપલબ્ધ નથી.",
      quickActions: {
        today: "આજની સ્થિતિ",
        approvals: "મંજૂરી",
        risk: "ઝોન જોખમ",
        robot: "Robot R1",
        outcome: "પરિણામ",
        communication: "સંદેશ",
        analyzeLeaf: "પાન તપાસો",
        reviewApproval: "મંજૂરી જુઓ"
      },
      prompts: {
        today: "મારા ખેતરની આજની કેરી બગીચાની સ્થિતિ જણાવો.",
        approvals: "હમણાં કઈ બાબતોને મંજૂરી જોઈએ?",
        risk: (zoneName) => `${zoneName} માં જોખમ કેમ છે?`,
        robot: "Robot R1 અત્યારે ક્યાં છે?",
        outcome: "સિંચાઈ કામ આવી?",
        communication: "ખેડૂતને કયા સંદેશ મોકલાયા?"
      },
      context: {
        priority: "પ્રાથમિકતા",
        approvals: "મંજૂરી",
        robot: "રોબોટ",
        outcome: "પરિણામ",
        tank: "ટાંકી",
        communication: "સંદેશ",
        noPriority: "સ્થિર",
        noApprovals: "કંઈ બાકી નથી",
        noRobot: "રોબોટ નથી",
        noOutcome: "પ્રતીક્ષા",
        noCommunication: "હજુ સંદેશ નથી"
      },
      system: {
        languageChanged: (languageName) => `આગળના જવાબો ${languageName} માં આવશે.`,
        reviewOpened: "Farm Admin માં મંજૂરી સમીક્ષા ખુલી છે.",
        noApproval: "જોવા માટે કોઈ બાકી મંજૂરી નથી.",
        visionStarted: "ઝોન B ના ઝાડ 23 માટે પાન તપાસ શરૂ થઈ.",
        visionFailed: "પાન તપાસ પૂર્ણ થઈ શકી નથી.",
        voiceFailed: "ખેતર સહાયક અત્યારે જવાબ આપી શક્યો નથી.",
        fallback: "ડેમો ફોલબેક સક્રિય છે."
      }
    },
    metricsPanel: {
      eyebrow: "લાઇવ મેટ્રિક્સ",
      title: "ઓપરેશનલ તૈયારી",
      updated: "અપડેટ 10:30:25 AM",
      noPriorityBlock: "પ્રાથમિક વિભાગ નથી",
      noRobot: "રોબોટ નથી",
      soilMoisture: "માટીની ભેજ",
      needsApproval: (count) => `${count} મંજૂરી જોઈએ`,
      points: "અંક",
      cards: {
        mangoTrees: { label: "કેરીનાં ઝાડ", value: "564", helper: "4 વિભાગ જોડાયા" },
        priorityBlock: { label: "પ્રાથમિક વિભાગ", helper: "24% માટીની ભેજ" },
        robot: { label: "Robot R1", helper: "કૅલિબ્રેટ માર્ગ પર" },
        tankLevel: { label: "ટાંકી સ્તર", value: "65%", helper: "2 ચક્ર માટે પૂરતું" },
        openAlerts: { label: "ખુલ્લા અલર્ટ", helper: "1 મંજૂરી જોઈએ" },
        nextVerify: { label: "આગલી ચકાસણી", value: "10 મિનિટ", helper: "Outcome Agent નક્કી" }
      }
    },
    evaluationsPanel: {
      eyebrow: "એજન્ટ મૂલ્યાંકન",
      title: "ગુણવત્તા, ખર્ચ, સમીક્ષા જોખમ",
      quality: "ગુણવત્તા",
      confidence: "વિશ્વાસ",
      latency: "વિલંબ",
      cost: "ખર્ચ",
      excellent: "ઉત્તમ",
      high: "ઉચ્ચ",
      endToEnd: "આરંભથી અંત સુધી",
      demoRun: "ડેમો રન",
      reviewGate: (zoneName) =>
        `ઉચ્ચ જોખમ અથવા ઓછા વિશ્વાસવાળા પગલાં સમીક્ષા માટે રહે છે. હાલનું સમીક્ષા ગેટ: ${zoneName} સારવાર મંજૂરી.`,
      none: "કશું નથી"
    },
    actionsPanel: {
      eyebrow: "સ્વચાલિત પગલાં",
      title: "Planner કતાર અને માનવી સમીક્ષા",
      fallbackQueue: [
        {
          title: "ડ્રિપ સિંચાઈ કતારમાં",
          detail: "ઝોન B - સાંજે 7:00 વાગ્યે 12 મિનિટ",
          status: "નક્કી",
          tone: "success"
        },
        {
          title: "રોબોટ તપાસ સોંપાઈ",
          detail: "R1 માર્ગ: ગેટ 1 -> ઝોન B -> ઝાડ 23 -> ટાંકી બે",
          status: "સક્રિય",
          tone: "info"
        },
        {
          title: "સારવાર સમીક્ષા",
          detail: "શક્ય ફંગલ જોખમ. છંટકાવ પહેલાં ખેડૂતની મંજૂરી જરૂરી.",
          status: "મંજૂરી",
          tone: "warning"
        },
        {
          title: "પરિણામ ચકાસણી",
          detail: "ફોલો-અપ ટેલિમેટ્રી સાથે ભેજ બેઝલાઇન સરખાવો.",
          status: "પ્રતીક્ષા",
          tone: "info"
        }
      ],
      actionTypes: {
        schedule_irrigation: "ડ્રિપ સિંચાઈ કતારમાં",
        robot_inspection: "રોબોટ તપાસ સોંપાઈ",
        farmer_voice_brief: "ખેડૂત વૉઇસ સંક્ષેપ",
        verify_outcome: "પરિણામ ચકાસણી",
        treatment_review: "સારવાર સમીક્ષા"
      }
    },
    communicationPanel: {
      eyebrow: "કમ્યુનિકેશન ગેટવે",
      title: "એસ્કલેશન અને ડિલિવરી",
      channels: {
        in_app: { label: "ઇન-ઍપ", status: "ઑનલાઇન" },
        whatsapp: { label: "WhatsApp", status: "પ્રાથમિક" },
        telegram: { label: "Telegram", status: "બેકઅપ" },
        sms: { label: "SMS", status: "ગંભીર" },
        phone_call: { label: "ફોન", status: "ગંભીર" }
      }
    },
    memoryPanel: {
      eyebrow: "મેમરી અને પરિણામ",
      title: "ફાર્મ જર્નલ",
      outcomeAgent: "Outcome Agent",
      baseline: (zoneName) =>
        `${zoneName} માં બેઝલાઇન ભેજ સંગ્રહાઈ છે. સિંચાઈ કારગર રહી કે નહીં તે ફોલો-અપ ટેલિમેટ્રી ચકાસશે.`,
      priorityZone: "પ્રાથમિક વિભાગ",
      events: [
        "છેલ્લા ટૂંકા સિંચાઈ ચક્ર પછી ઝોન B માં 14 અંક સુધારો થયો.",
        "ટાંકી સ્તર 55%થી નીચે ગયા પછી કેસર વિભાગમાં ફરી તાણ દેખાયો.",
        "ખેડૂતને મરાઠી વૉઇસ સંક્ષેપ અને WhatsApp મંજૂરી લિંક્સ પસંદ છે.",
        "પાછલો ફંગલ અલર્ટ રોબોટ ક્લોઝ-અપ સમીક્ષા પછી ઓછા જોખમનો થયો."
      ]
    },
    footer: {
      backend: "બેકએન્ડ",
      connectedSensors: "જોડાયેલા સેન્સર",
      activeRobot: "સક્રિય રોબોટ",
      pendingAlerts: "બાકી અલર્ટ"
    },
    common: {
      none: "કશું નથી",
      fallbackData: "ફોલબેક ડેટા",
      farmAdmin: "ફાર્મ એડમિન",
      server: "સર્વર",
      system: "સિસ્ટમ",
      syncingTime: "સમય સિંક થાય છે"
    },
    statuses: {
      completed: "પૂર્ણ",
      queued: "કતારમાં",
      fallback: "ફોલબેક",
      review: "સમીક્ષા",
      scheduled: "નક્કી",
      active: "સક્રિય",
      approval: "મંજૂરી",
      waiting: "પ્રતીક્ષા",
      recommended: "ભલામણ",
      needs_approval: "મંજૂરી જોઈએ",
      pending_verification: "ચકાસણી બાકી",
      verified: "ચકાસાયેલ",
      failed: "નિષ્ફળ",
      online: "ઑનલાઇન",
      preferred: "પ્રાથમિક",
      backup: "બેકઅપ",
      critical: "ગંભીર",
      simulated: "સિમ્યુલેટેડ",
      sent: "મોકલ્યું",
      delivered: "પહોંચ્યું",
      successful: "સફળ",
      partial: "આંશિક",
      ready: "તૈયાર"
    },
    robotStatuses: {
      available: "ઉપલબ્ધ",
      assigned: "સોંપાયેલ",
      charging: "ચાર્જ થઈ રહ્યું",
      offline: "ઑફલાઇન"
    },
    knownText: {
      "Checking backend health...": "બેકએન્ડ હેલ્થ તપાસે છે...",
      "Routed Zone B mango moisture anomaly into the sensor anomaly workflow.":
        "ઝોન B કેરી ભેજ વિસંગતિ સેન્સર વિસંગતિ વર્કફ્લોમાં મોકલાઈ.",
      "Supervisor routed the event into the correct AgriOS workflow.":
        "Supervisor એ ઇવેન્ટને યોગ્ય AgriOS વર્કફ્લોમાં મોકલી.",
      "Zone B soil moisture is low at 24% with rising canopy temperature.":
        "ઝોન B માં માટીની ભેજ 24% ઓછી છે અને કેનોપી તાપમાન વધી રહ્યું છે.",
      "Mock forecast shows no heavy rain in the next 6 hours.":
        "મૉક અંદાજ પ્રમાણે આવતા 6 કલાકમાં ભારે વરસાદ નથી.",
      "Leaf image from Tree 23 shows possible early fungal marks.":
        "ઝાડ 23 ની પાન છબીમાં શરૂઆતના ફંગલ ડાઘ દેખાઈ શકે છે.",
      "Possible early blight detected on the demo leaf image.":
        "ડેમો પાન છબીમાં શક્ય શરૂઆતનો બ્લાઇટ મળ્યો.",
      "Water stress is high; treatment risk requires farmer review.":
        "પાણીનો તાણ વધુ છે; સારવાર જોખમ માટે ખેડૂત સમીક્ષા જરૂરી.",
      "Water stress is high; treatment decisions require farmer review.":
        "પાણીનો તાણ વધુ છે; સારવાર નિર્ણય માટે ખેડૂત સમીક્ષા જરૂરી.",
      "Zone B water stress is high and should be acted on.":
        "ઝોન B માં પાણીનો તાણ વધુ છે અને પગલું જરૂરી છે.",
      "Scheduled drip irrigation, robot inspection, communication, and outcome verification.":
        "ડ્રિપ સિંચાઈ, રોબોટ તપાસ, સંચાર અને પરિણામ ચકાસણી નક્કી થઈ.",
      "Scheduled irrigation, robot inspection, communication, and outcome verification.":
        "સિંચાઈ, રોબોટ તપાસ, સંચાર અને પરિણામ ચકાસણી નક્કી થઈ.",
      "Robot R1 assigned to Gate 1 -> Zone B -> Tree 23 -> Tank bay route.":
        "Robot R1 ને ગેટ 1 -> ઝોન B -> ઝાડ 23 -> ટાંકી બે માર્ગ સોંપાયો.",
      "Robot R1 remains available for inspection.": "Robot R1 તપાસ માટે ઉપલબ્ધ છે.",
      "Farmer notification simulated through WhatsApp with SMS and phone escalation ready.":
        "SMS અને ફોન એસ્કલેશન તૈયાર રાખીને WhatsApp પર ખેડૂત સૂચના સિમ્યુલેટ થઈ.",
      "Stored Zone B moisture baseline and scheduled follow-up telemetry comparison.":
        "ઝોન B ભેજ બેઝલાઇન સંગ્રહાઈ અને ફોલો-અપ ટેલિમેટ્રી સરખામણી નક્કી થઈ.",
      "Stored Zone B moisture baseline and verified simulated follow-up telemetry.":
        "ઝોન B ભેજ બેઝલાઇન સંગ્રહાઈ અને સિમ્યુલેટેડ ફોલો-અપ ટેલિમેટ્રી ચકાસાઈ.",
      "Workflow quality is high; one human-review gate is correctly preserved.":
        "વર્કફ્લો ગુણવત્તા ઊંચી છે; એક માનવી સમીક્ષા ગેટ યોગ્ય રીતે રાખ્યું છે.",
      "Workflow quality is high; human-review gates are visible.":
        "વર્કફ્લો ગુણવત્તા ઊંચી છે; માનવી સમીક્ષા ગેટ દેખાય છે.",
      "Wrote farm journal entry for Zone B moisture stress, robot route, and farmer approval.":
        "ઝોન B ભેજ તાણ, રોબોટ માર્ગ અને ખેડૂત મંજૂરી માટે ફાર્મ જર્નલ નોંધ લખાઈ.",
      "Wrote farm journal entry for the latest workflow.":
        "તાજેતરના વર્કફ્લો માટે ફાર્મ જર્નલ નોંધ લખાઈ.",
      "Voice prompt received and normalized for farm-state lookup.":
        "Voice પ્રોમ્પ્ટ મળ્યો અને ફાર્મ-સ્થિતિ શોધ માટે સામાન્ય થયો.",
      "Farm status response generated with text fallback.":
        "ટેક્સ્ટ ફોલબેકથી ફાર્મ સ્થિતિ જવાબ બન્યો.",
      "Voice Agent retrieved recent risks, scheduled actions, pending approvals, and outcomes.":
        "Voice Agent એ તાજેતરના જોખમો, નક્કી પગલાં, બાકી મંજૂરી અને પરિણામો મેળવ્યા.",
      "12 minute drip irrigation scheduled for Zone B.":
        "ઝોન B માટે 12 મિનિટની ડ્રિપ સિંચાઈ નક્કી.",
      "Robot R1 assigned to inspect Tree 23 for water stress and leaf marks.":
        "પાણીના તાણ અને પાન નિશાનો માટે ઝાડ 23 તપાસવાનું કામ Robot R1 ને મળ્યું.",
      "Robot R1 assigned to inspect Tree 23 and the Zone B drip line.":
        "ઝાડ 23 અને ઝોન B ડ્રિપ લાઇન તપાસવાનું કામ Robot R1 ને મળ્યું.",
      "Marathi voice brief prepared for the farmer.": "ખેડૂત માટે મરાઠી વૉઇસ સંક્ષેપ તૈયાર.",
      "Outcome Agent will compare follow-up telemetry after irrigation.":
        "સિંચાઈ પછી Outcome Agent ફોલો-અપ ટેલિમેટ્રી સરખાવશે.",
      "Possible fungal treatment is held for farmer approval before spraying.":
        "છંટકાવ પહેલાં શક્ય ફંગલ સારવાર ખેડૂત મંજૂરી માટે રોકાઈ છે.",
      "Vision Agent found possible early fungal marks. Spraying requires farmer approval.":
        "Vision Agent ને શક્ય શરૂઆતના ફંગલ ડાઘ મળ્યા. છંટકાવ માટે ખેડૂત મંજૂરી જોઈએ.",
      "Fungal treatment review": "ફંગલ સારવાર સમીક્ષા",
      "Zone B improved by 14 points after the last short irrigation cycle.":
        "છેલ્લા ટૂંકા સિંચાઈ ચક્ર પછી ઝોન B માં 14 અંક સુધારો થયો.",
      "Kesar block showed repeat stress when tank level dropped below 55%.":
        "ટાંકી સ્તર 55%થી નીચે ગયા પછી કેસર વિભાગમાં ફરી તાણ દેખાયો.",
      "Farmer prefers Marathi voice brief and WhatsApp approval links.":
        "ખેડૂતને મરાઠી વૉઇસ સંક્ષેપ અને WhatsApp મંજૂરી લિંક્સ પસંદ છે.",
      "Farmer prefers Marathi voice briefs and WhatsApp approval links.":
        "ખેડૂતને મરાઠી વૉઇસ સંક્ષેપ અને WhatsApp મંજૂરી લિંક્સ પસંદ છે.",
      "Previous fungal alert was downgraded after robot close-up review.":
        "પાછલો ફંગલ અલર્ટ રોબોટ ક્લોઝ-અપ સમીક્ષા પછી ઓછા જોખમનો થયો.",
      "Recorded low moisture, scheduled irrigation, simulated farmer alert, and verified outcome.":
        "ઓછી ભેજ નોંધાઈ, સિંચાઈ નક્કી થઈ, ખેડૂત અલર્ટ સિમ્યુલેટ થયો અને પરિણામ ચકાસાયું.",
      "Recorded fallback leaf analysis, robot inspection, and treatment approval request.":
        "ફોલબેક પાન વિશ્લેષણ, રોબોટ તપાસ અને સારવાર મંજૂરી વિનંતી નોંધાઈ.",
      "Zone B moisture is critically low. Short irrigation has been scheduled and will be verified in 10 minutes.":
        "ઝોન B ની ભેજ ગંભીર રીતે ઓછી છે. ટૂંકી સિંચાઈ નક્કી છે અને 10 મિનિટમાં ચકાસાશે.",
      "Zone B is dry, irrigation is scheduled, Robot R1 is inspecting the crop, and no heavy rain is expected in the next 6 hours.":
        "ઝોન B સૂકો છે, સિંચાઈ નક્કી છે, Robot R1 પાકની તપાસ કરી રહ્યો છે અને આવતા 6 કલાકમાં ભારે વરસાદની શક્યતા નથી.",
      "Zone B madhye mati sukhi aahe. 12 minute drip sinchan scheduled aahe, Robot R1 tapasnisathi Zone B madhye aahe, ani pudhchya 6 tasat motha paus expected nahi.":
        "ઝોન B સૂકો છે, સિંચાઈ નક્કી છે, Robot R1 પાકની તપાસ કરી રહ્યો છે અને આવતા 6 કલાકમાં ભારે વરસાદની શક્યતા નથી."
    },
    patterns: {
      sensorCritical: (moisture) => `ઝોન B માં માટીની ભેજ ગંભીર રીતે ઓછી, ${moisture}% છે.`,
      outcomeMoisture: (before, after) => `સિંચાઈ પછી ઝોન B ની ભેજ ${before}% થી ${after}% થઈ.`
    }
  }
};
