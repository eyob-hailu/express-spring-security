<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

const isFullscreen = ref(false);
const svgWrapperRef = ref(null);

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
  if (typeof document !== "undefined") {
    if (isFullscreen.value) {
      document.body.style.overflow = "hidden";
      nextTick(() => {
        if (svgWrapperRef.value) {
          svgWrapperRef.value.scrollTop = 0;
          svgWrapperRef.value.scrollLeft = 0;
        }
      });
    } else {
      document.body.style.overflow = "";
    }
  }
}

function handleKeydown(e) {
  if (e.key === "Escape" && isFullscreen.value) {
    toggleFullscreen();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
});
</script>

<template>
  <div
    class="request-lifecycle-container"
    :class="{ 'is-fullscreen': isFullscreen }"
  >
    <div class="diagram-header">
      <div class="header-title">
        <span class="icon">🔄</span>
        <span class="title-text">Request Lifecycle Architecture</span>
      </div>
      <div class="header-controls">
        <div class="header-badge">Architecture Flowchart</div>
        <button
          type="button"
          class="fullscreen-toggle-btn"
          @click="toggleFullscreen"
          :title="
            isFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen View'
          "
        >
          <span class="btn-icon">{{ isFullscreen ? "✕" : "⛶" }}</span>
          <span class="btn-text">{{
            isFullscreen ? "Close" : "Fullscreen"
          }}</span>
        </button>
      </div>
    </div>

    <!-- High-Legibility Visual Architecture Flowchart -->
    <div ref="svgWrapperRef" class="svg-wrapper">
      <svg
        viewBox="0 0 1020 1450"
        xmlns="http://www.w3.org/2000/svg"
        class="lifecycle-svg"
        aria-label="Request Lifecycle Architecture Diagram"
      >
        <defs>
          <!-- Gradients with rich, high-contrast saturation -->
          <linearGradient id="grad-req" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>
          <linearGradient id="grad-context" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7c3aed" />
            <stop offset="100%" stop-color="#5b21b6" />
          </linearGradient>
          <linearGradient id="grad-pipe" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#075985" />
          </linearGradient>
          <linearGradient id="grad-jwt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1e40af" />
          </linearGradient>
          <linearGradient id="grad-matcher" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0d9488" />
            <stop offset="100%" stop-color="#115e59" />
          </linearGradient>
          <linearGradient id="grad-preauth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#d97706" />
            <stop offset="100%" stop-color="#92400e" />
          </linearGradient>
          <linearGradient id="grad-error" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#991b1b" />
          </linearGradient>
          <linearGradient
            id="grad-controller"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stop-color="#059669" />
            <stop offset="100%" stop-color="#065f46" />
          </linearGradient>
          <linearGradient id="grad-service" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="100%" stop-color="#3730a3" />
          </linearGradient>
          <linearGradient id="grad-res" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="100%" stop-color="#047857" />
          </linearGradient>

          <!-- Drop Shadow Filter -->
          <filter
            id="shadow"
            x="-8%"
            y="-8%"
            width="120%"
            height="125%"
            filterUnits="userSpaceOnUse"
          >
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="6"
              flood-color="#000000"
              flood-opacity="0.32"
            />
          </filter>

          <!-- Arrow Markers -->
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" class="arrow-marker" />
          </marker>
          <marker
            id="arrow-green"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
          </marker>
          <marker
            id="arrow-red"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ef4444" />
          </marker>
        </defs>

        <!-- Background Container Area -->
        <rect width="1020" height="1450" rx="16" class="svg-bg" />

        <!-- ================= CONNECTING LINES & ARROWS ================= -->

        <!-- 0 -> 1: Req to SCH -->
        <path
          d="M 620 82 L 620 148"
          class="flow-line"
          stroke-width="3"
          marker-end="url(#arrow)"
        />

        <!-- 1 -> 2: SCH to Pre-Filters -->
        <path
          d="M 620 246 L 620 312"
          class="flow-line"
          stroke-width="3"
          marker-end="url(#arrow)"
        />

        <!-- 2 -> 3: Pre-Filters to JWT -->
        <path
          d="M 620 410 L 620 476"
          class="flow-line"
          stroke-width="3"
          marker-end="url(#arrow)"
        />

        <!-- 3 -> 4: JWT to Matcher -->
        <path
          d="M 620 574 L 620 640"
          class="flow-line"
          stroke-width="3"
          marker-end="url(#arrow)"
        />

        <!-- 4 -> 401 AEP (Left Upper Branch) -->
        <path
          d="M 350 675 L 175 675 L 175 754"
          fill="none"
          stroke="#ef4444"
          stroke-width="3"
          marker-end="url(#arrow-red)"
        />
        <rect
          x="195"
          y="658"
          width="145"
          height="32"
          rx="6"
          class="badge-box-red"
          stroke-width="2"
        />
        <text
          x="267"
          y="680"
          text-anchor="middle"
          font-size="13.5"
          font-weight="700"
          letter-spacing="0.3px"
          fill="#ef4444"
        >
          Unauthorized (401)
        </text>

        <!-- 4 -> 403 ADH (Left Lower Branch) -->
        <path
          d="M 350 720 L 70 720 L 70 914"
          fill="none"
          stroke="#ef4444"
          stroke-width="3"
          marker-end="url(#arrow-red)"
        />
        <rect
          x="180"
          y="704"
          width="135"
          height="32"
          rx="6"
          class="badge-box-red"
          stroke-width="2"
        />
        <text
          x="247"
          y="726"
          text-anchor="middle"
          font-size="13.5"
          font-weight="700"
          letter-spacing="0.3px"
          fill="#ef4444"
        >
          Forbidden (403)
        </text>

        <!-- 4 -> PreAuthorize (Authorized - Center Down) -->
        <path
          d="M 620 744 L 620 820"
          stroke="#10b981"
          stroke-width="3"
          marker-end="url(#arrow-green)"
        />
        <rect
          x="555"
          y="768"
          width="130"
          height="30"
          rx="6"
          class="badge-box-green"
          stroke-width="2"
        />
        <text
          x="620"
          y="789"
          text-anchor="middle"
          font-size="14"
          font-weight="700"
          letter-spacing="0.3px"
          fill="#10b981"
        >
          Authorized
        </text>

        <!-- 4 -> Controller (permitAll() Right Bypass) -->
        <path
          d="M 890 693 L 950 693 L 950 1050 L 898 1050"
          fill="none"
          stroke="#10b981"
          stroke-width="3"
          stroke-dasharray="8,5"
          marker-end="url(#arrow-green)"
        />
        <rect
          x="895"
          y="750"
          width="110"
          height="30"
          rx="6"
          class="badge-box-green"
          stroke-width="2"
        />
        <text
          x="950"
          y="771"
          text-anchor="middle"
          font-size="14"
          font-weight="700"
          letter-spacing="0.3px"
          fill="#10b981"
        >
          permitAll()
        </text>

        <!-- 5 -> ADH (Denied 403) -->
        <path
          d="M 350 873 L 260 873 L 260 914"
          fill="none"
          stroke="#ef4444"
          stroke-width="3"
          marker-end="url(#arrow-red)"
        />
        <rect
          x="235"
          y="857"
          width="110"
          height="30"
          rx="6"
          class="badge-box-red"
          stroke-width="2"
        />
        <text
          x="290"
          y="878"
          text-anchor="middle"
          font-size="13.5"
          font-weight="700"
          letter-spacing="0.3px"
          fill="#ef4444"
        >
          Denied (403)
        </text>

        <!-- 5 -> Controller (Allowed - Center Down) -->
        <path
          d="M 620 924 L 620 1000"
          stroke="#10b981"
          stroke-width="3"
          marker-end="url(#arrow-green)"
        />
        <rect
          x="565"
          y="948"
          width="110"
          height="30"
          rx="6"
          class="badge-box-green"
          stroke-width="2"
        />
        <text
          x="620"
          y="969"
          text-anchor="middle"
          font-size="14"
          font-weight="700"
          letter-spacing="0.3px"
          fill="#10b981"
        >
          Allowed
        </text>

        <!-- 6 -> Service Layer -->
        <path
          d="M 620 1098 L 620 1158"
          class="flow-line"
          stroke-width="3"
          marker-end="url(#arrow)"
        />

        <!-- 7 -> Response -->
        <path
          d="M 620 1256 L 620 1308"
          stroke="#10b981"
          stroke-width="3"
          marker-end="url(#arrow-green)"
        />

        <!-- ================= NODES / STAGES ================= -->

        <!-- 0. HTTP Request Entry -->
        <g class="node node-req" filter="url(#shadow)">
          <rect
            x="490"
            y="30"
            width="260"
            height="52"
            rx="26"
            fill="url(#grad-req)"
            stroke="#93c5fd"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="63"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18"
            font-weight="700"
            letter-spacing="0.4px"
          >
            🌐 HTTP Request
          </text>
        </g>

        <!-- 1. SecurityContextHolder.initialize() -->
        <g class="node node-sch" filter="url(#shadow)">
          <rect
            x="350"
            y="150"
            width="540"
            height="96"
            rx="16"
            fill="url(#grad-context)"
            stroke="#c4b5fd"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="186"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18.5"
            font-weight="700"
            letter-spacing="0.4px"
          >
            1. SecurityContextHolder.initialize()
          </text>
          <text
            x="620"
            y="220"
            text-anchor="middle"
            fill="#f8fafc"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            Creates AsyncLocalStorage ambient request scope
          </text>
        </g>

        <!-- 2. Pre-Filters Pipeline -->
        <g class="node node-pre" filter="url(#shadow)">
          <rect
            x="350"
            y="314"
            width="540"
            height="96"
            rx="16"
            fill="url(#grad-pipe)"
            stroke="#7dd3fc"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="350"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18.5"
            font-weight="700"
            letter-spacing="0.4px"
          >
            2. Pre-Filters Pipeline
          </text>
          <text
            x="620"
            y="384"
            text-anchor="middle"
            fill="#f8fafc"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            CORS, express.json(), Helmet headers &amp; rate limiters
          </text>
        </g>

        <!-- 3. JwtAuthenticationFilter -->
        <g class="node node-jwt" filter="url(#shadow)">
          <rect
            x="350"
            y="478"
            width="540"
            height="96"
            rx="16"
            fill="url(#grad-jwt)"
            stroke="#93c5fd"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="514"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18.5"
            font-weight="700"
            letter-spacing="0.4px"
          >
            3. JwtAuthenticationFilter
          </text>
          <text
            x="620"
            y="548"
            text-anchor="middle"
            fill="#f8fafc"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            Verifies Bearer token (HMAC / RSA / JWKS) &amp; sets context
          </text>
        </g>

        <!-- 4. AuthorizeHttpRequests (URL Rules Engine) -->
        <g class="node node-matcher" filter="url(#shadow)">
          <rect
            x="350"
            y="642"
            width="540"
            height="102"
            rx="16"
            fill="url(#grad-matcher)"
            stroke="#5eead4"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="680"
            text-anchor="middle"
            fill="#ffffff"
            font-size="19"
            font-weight="700"
            letter-spacing="0.4px"
          >
            4. AuthorizeHttpRequests
          </text>
          <text
            x="620"
            y="716"
            text-anchor="middle"
            fill="#f8fafc"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            AntPathMatcher: declarative first-match-wins URL rules
          </text>
        </g>

        <!-- 401 Handler: AuthenticationEntryPoint -->
        <g class="node node-aep" filter="url(#shadow)">
          <rect
            x="40"
            y="760"
            width="270"
            height="92"
            rx="14"
            fill="url(#grad-error)"
            stroke="#fca5a5"
            stroke-width="2.5"
          />
          <text
            x="175"
            y="796"
            text-anchor="middle"
            fill="#ffffff"
            font-size="16"
            font-weight="700"
            letter-spacing="0.3px"
          >
            AuthenticationEntryPoint
          </text>
          <text
            x="175"
            y="828"
            text-anchor="middle"
            fill="#fecaca"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
          >
            HTTP 401 Unauthorized
          </text>
        </g>

        <!-- 403 Handler: AccessDeniedHandler -->
        <g class="node node-adh" filter="url(#shadow)">
          <rect
            x="40"
            y="920"
            width="270"
            height="92"
            rx="14"
            fill="url(#grad-error)"
            stroke="#fca5a5"
            stroke-width="2.5"
          />
          <text
            x="175"
            y="956"
            text-anchor="middle"
            fill="#ffffff"
            font-size="16"
            font-weight="700"
            letter-spacing="0.3px"
          >
            AccessDeniedHandler
          </text>
          <text
            x="175"
            y="988"
            text-anchor="middle"
            fill="#fecaca"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
          >
            HTTP 403 Forbidden
          </text>
        </g>

        <!-- 5. @PreAuthorize / Method Security -->
        <g class="node node-preauth" filter="url(#shadow)">
          <rect
            x="350"
            y="822"
            width="540"
            height="102"
            rx="16"
            fill="url(#grad-preauth)"
            stroke="#fde047"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="860"
            text-anchor="middle"
            fill="#ffffff"
            font-size="19"
            font-weight="700"
            letter-spacing="0.4px"
          >
            5. @PreAuthorize / Method Security
          </text>
          <text
            x="620"
            y="896"
            text-anchor="middle"
            fill="#fef3c7"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            Stage 2 &amp; 3 decorators • SpEL-style ownership predicates
          </text>
        </g>

        <!-- 6. Controller / Route Handler -->
        <g class="node node-route" filter="url(#shadow)">
          <rect
            x="350"
            y="1002"
            width="540"
            height="96"
            rx="16"
            fill="url(#grad-controller)"
            stroke="#6ee7b7"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="1038"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18.5"
            font-weight="700"
            letter-spacing="0.4px"
          >
            Controller / Route Handler
          </text>
          <text
            x="620"
            y="1072"
            text-anchor="middle"
            fill="#f8fafc"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            Express route handler with auto-bound this context
          </text>
        </g>

        <!-- 7. Service / Domain Layer -->
        <g class="node node-service" filter="url(#shadow)">
          <rect
            x="350"
            y="1160"
            width="540"
            height="96"
            rx="16"
            fill="url(#grad-service)"
            stroke="#a5b4fc"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="1196"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18.5"
            font-weight="700"
            letter-spacing="0.4px"
          >
            Service / Domain Layer
          </text>
          <text
            x="620"
            y="1230"
            text-anchor="middle"
            fill="#f8fafc"
            font-size="15"
            font-weight="500"
            letter-spacing="0.3px"
          >
            SecurityContextHolder.getContext() without drilling req
          </text>
        </g>

        <!-- 8. HTTP Response Exit -->
        <g class="node node-res" filter="url(#shadow)">
          <rect
            x="490"
            y="1310"
            width="260"
            height="52"
            rx="26"
            fill="url(#grad-res)"
            stroke="#6ee7b7"
            stroke-width="2.5"
          />
          <text
            x="620"
            y="1343"
            text-anchor="middle"
            fill="#ffffff"
            font-size="18"
            font-weight="700"
            letter-spacing="0.4px"
          >
            🚀 HTTP Response
          </text>
        </g>

        <!-- ================= LEGEND / FOOTER ================= -->
        <g class="diagram-legend" transform="translate(45, 1405)">
          <circle cx="10" cy="10" r="7" fill="#7c3aed" />
          <text
            x="24"
            y="15"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
            class="legend-text"
          >
            Ambient Context
          </text>

          <circle cx="180" cy="10" r="7" fill="#0284c7" />
          <text
            x="194"
            y="15"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
            class="legend-text"
          >
            Filter Chain
          </text>

          <circle cx="320" cy="10" r="7" fill="#0d9488" />
          <text
            x="334"
            y="15"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
            class="legend-text"
          >
            URL Authorization
          </text>

          <circle cx="510" cy="10" r="7" fill="#d97706" />
          <text
            x="524"
            y="15"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
            class="legend-text"
          >
            Method Security
          </text>

          <circle cx="690" cy="10" r="7" fill="#10b981" />
          <text
            x="704"
            y="15"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
            class="legend-text"
          >
            Allowed / Success
          </text>

          <circle cx="865" cy="10" r="7" fill="#dc2626" />
          <text
            x="879"
            y="15"
            font-size="14.5"
            font-weight="600"
            letter-spacing="0.2px"
            class="legend-text"
          >
            401/403
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.request-lifecycle-container {
  margin: 28px 0 36px 0;
  border: 1.5px solid #cbd5e1;
  border-radius: 16px;
  background-color: #ffffff;
  box-shadow:
    0 10px 30px -4px rgba(0, 0, 0, 0.08),
    0 2px 6px -1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  font-family: var(--vp-font-family-base, system-ui, -apple-system, sans-serif);
  transition: all 0.25s ease;
}

.diagram-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1.5px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  font-size: 1.12rem;
  color: #0f172a;
}

.title-text {
  color: #0f172a;
  letter-spacing: 0.25px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-badge {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 9999px;
  background-color: rgba(16, 185, 129, 0.12);
  color: #047857;
  border: 1.5px solid rgba(16, 185, 129, 0.35);
  letter-spacing: 0.3px;
}

.fullscreen-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 8px;
  background-color: #ffffff;
  color: #334155;
  border: 1.5px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.fullscreen-toggle-btn:hover {
  background-color: #10b981;
  color: #ffffff;
  border-color: #10b981;
  transform: translateY(-1px);
}

.svg-wrapper {
  padding: 28px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
}

.lifecycle-svg {
  width: 100%;
  min-width: 820px;
  max-width: 1000px;
  height: auto;
  display: block;
  user-select: none;
}

.lifecycle-svg text {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.svg-bg {
  fill: transparent;
}

.badge-box-red {
  fill: #ffffff;
  stroke: #dc2626;
}

.badge-box-green {
  fill: #ffffff;
  stroke: #059669;
}

.flow-line {
  stroke: #64748b;
}

.arrow-marker {
  fill: #64748b;
}

.legend-text {
  fill: #334155;
}

/* Explicit Ultra-Crisp Dark Mode Overrides */
:global(html.dark) .request-lifecycle-container {
  background-color: #171922 !important;
  border: 1.5px solid #2e3547 !important;
  box-shadow:
    0 16px 48px -6px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(255, 255, 255, 0.08) !important;
}

:global(html.dark) .diagram-header {
  background: linear-gradient(180deg, #252a38 0%, #1c202d 100%) !important;
  border-bottom: 1.5px solid #2e3547 !important;
}

:global(html.dark) .header-title,
:global(html.dark) .title-text {
  color: #ffffff !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px !important;
}

:global(html.dark) .header-badge {
  background-color: rgba(16, 185, 129, 0.2) !important;
  color: #34d399 !important;
  border: 1.5px solid rgba(52, 211, 153, 0.5) !important;
}

:global(html.dark) .fullscreen-toggle-btn {
  background-color: #242938 !important;
  color: #f1f5f9 !important;
  border-color: #3b4359 !important;
}

:global(html.dark) .fullscreen-toggle-btn:hover {
  background-color: #10b981 !important;
  color: #ffffff !important;
  border-color: #10b981 !important;
}

:global(html.dark) .svg-wrapper {
  background: radial-gradient(
    ellipse at top,
    #161925 0%,
    #0d0f17 100%
  ) !important;
}

:global(html.dark) .badge-box-red {
  fill: #221215 !important;
  stroke: #ef4444 !important;
}

:global(html.dark) .badge-box-green {
  fill: #0c1f17 !important;
  stroke: #10b981 !important;
}

:global(html.dark) .flow-line {
  stroke: #94a3b8 !important;
}

:global(html.dark) .arrow-marker {
  fill: #94a3b8 !important;
}

:global(html.dark) .legend-text {
  fill: #e2e8f0 !important;
}

/* Fullscreen Expanded View Mode */
.request-lifecycle-container.is-fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  margin: 0 !important;
  border-radius: 0 !important;
  border: none !important;
  z-index: 99999 !important;
  display: flex !important;
  flex-direction: column !important;
  background-color: #ffffff !important;
  box-shadow: none !important;
}

:global(html.dark) .request-lifecycle-container.is-fullscreen {
  background-color: #0b0d13 !important;
}

.request-lifecycle-container.is-fullscreen .diagram-header {
  border-radius: 0 !important;
  padding: 18px 36px !important;
  flex-shrink: 0 !important;
  border-bottom-width: 2px !important;
}

.request-lifecycle-container.is-fullscreen .svg-wrapper {
  flex: 1 !important;
  overflow: auto !important;
  display: flex !important;
  justify-content: center !important;
  align-items: flex-start !important;
  padding: 32px 24px 64px 24px !important;
}

.request-lifecycle-container.is-fullscreen .lifecycle-svg {
  max-width: 1120px !important;
  width: 100% !important;
}
</style>
