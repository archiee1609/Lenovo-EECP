"""
Streamlit Wrapper for Lenovo Elite Engineer Registry
---------------------------------------------------
This Streamlit application acts as a secure container to host the fully-featured, 
interactive Lenovo Elite Engineer Registry built with React, Vite, and Tailwind CSS.

Requirements:
    pip install streamlit

How to run:
    1. Compile the React frontend assets (if not already done):
       npm run build
    2. Start the Streamlit server:
       streamlit run app.py
"""

import os
import streamlit as st
import streamlit.components.v1 as components

# 1. Page Configuration
st.set_page_config(
    page_title="Lenovo Elite Engineer Registry",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. Immersive Styling & Custom Layout
# Hides standard Streamlit decorations, headers, and footers, and sets up the iframe to occupy the full screen height.
hide_streamlit_style = """
<style>
/* Hide Main Menu, header, footer, and top decoration bar */
#MainMenu {visibility: hidden;}
footer {visibility: hidden;}
header {visibility: hidden;}
div[data-testid="stDecoration"] {visibility: hidden;}

/* Reset container padding to allow full-viewport rendering */
div[data-testid="stAppViewBlockContainer"] {
    padding-top: 0rem !important;
    padding-bottom: 0rem !important;
    padding-left: 0rem !important;
    padding-right: 0rem !important;
}

/* Ensure the component iframe handles size elegantly */
iframe {
    width: 100% !important;
    height: calc(100vh - 8px) !important;
    border: none !important;
    border-radius: 0px !important;
}

body {
    background-color: #f4f5f6;
}
</style>
"""
st.markdown(hide_streamlit_style, unsafe_allow_html=True)

# 3. Path Resolution
# Resolves the build output directory ('static') of the React Vite compilation.
parent_dir = os.path.dirname(os.path.abspath(__file__))
build_dir = os.path.join(parent_dir, "static")

# 4. Streamlit Render Logic
if not os.path.exists(build_dir) or not os.path.exists(os.path.join(build_dir, "index.html")):
    # Warning message if frontend hasn't been compiled
    st.warning("⚠️ Welcome to the Streamlit Host Setup!")
    st.info(
        "To run this fully interactive React application inside Streamlit, you must first compile the production assets.\n\n"
        "**Steps to get started:**\n"
        "1. Open your terminal in this project root.\n"
        "2. Run the install and build commands:\n"
        "   ```bash\n"
        "   npm install\n"
        "   npm run build\n"
        "   ```\n"
        "3. Once complete, run this Streamlit host script:\n"
        "   ```bash\n"
        "   streamlit run app.py\n"
        "   ```"
    )
else:
    # Render the React application via Streamlit's built-in static file serving iframe.
    # This is 100% reliable, avoids any "custom component loading" latency/errors,
    # and handles routing, CSS, and javascript bundles perfectly.
    components.iframe(
        src="/app/static/index.html",
        height=1000,
        scrolling=True
    )
