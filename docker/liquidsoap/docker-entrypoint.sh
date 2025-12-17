#!/bin/sh
set -eu

# ENTRYPOINT for OPAM-built Liquidsoap container
# - expects OPAMROOT to be /opt/liquidsoap/opamroot by default
# - evaluates opam env if opam is available
# - adjusts OCaml-related env vars to point inside the extracted OPAMROOT switch
# - ensures Liquidsoap sees its stdlib.liq by exporting LIQUIDSOAP_* vars

: "${OPAMROOT:=/opt/liquidsoap/opamroot}"
export OPAMROOT

err() { printf '%s\n' "$*" >&2; }

# Detect switch (if opam present) and eval opam env (best-effort)
SWITCH=""
if command -v opam >/dev/null 2>&1; then
  SWITCH="$(opam switch list --root="$OPAMROOT" --short 2>/dev/null | awk 'NF{print $1; exit}' || true)"
  if [ -n "$SWITCH" ]; then
    echo "Detected opam switch: $SWITCH (root: $OPAMROOT)"
    # evaluate opam env for switch (ignore failure but try fallback)
    eval "$(opam env --root="$OPAMROOT" --switch="$SWITCH" 2>/dev/null || opam env --root="$OPAMROOT" 2>/dev/null || true)" || true
  else
    echo "No opam switch listed for root; trying 'opam env --root' fallback..."
    eval "$(opam env --root="$OPAMROOT" 2>/dev/null || true)" || true
  fi
else
  echo "opam not found in runtime; will try to derive PATH from OPAMROOT."
fi

# If we have a discovered switch path inside the extracted OPAM root, rewrite key OCaml envs
if [ -n "$SWITCH" ]; then
  SWROOT="$OPAMROOT/$SWITCH"
  if [ -d "$SWROOT" ]; then
    # set CAML_LD_LIBRARY_PATH — include typical stublibs and ocaml libs
    export CAML_LD_LIBRARY_PATH="$SWROOT/lib/stublibs:$SWROOT/lib/ocaml/stublibs:$SWROOT/lib/ocaml${CAML_LD_LIBRARY_PATH+:$CAML_LD_LIBRARY_PATH}"
    # toplevel paths
    export OCAML_TOPLEVEL_PATH="$SWROOT/lib/toplevel${OCAML_TOPLEVEL_PATH+:$OCAML_TOPLEVEL_PATH}"
    export OCAMLTOP_INCLUDE_PATH="$SWROOT/lib/toplevel${OCAMLTOP_INCLUDE_PATH+:$OCAMLTOP_INCLUDE_PATH}"
    # ensure manpath includes switch man dir
    export MANPATH=":$SWROOT/man${MANPATH:+:$MANPATH}"
    # ensure switch bin is first in PATH
    export PATH="$SWROOT/bin:$PATH"
  fi
fi

# If PATH still doesn't contain OPAMROOT, prepend discovered bin dirs under OPAMROOT
if ! echo "$PATH" | grep -q "$OPAMROOT"; then
  BIN_DIRS=$(find "$OPAMROOT" -maxdepth 4 -type d -name bin 2>/dev/null || true)
  if [ -n "$BIN_DIRS" ]; then
    for d in $BIN_DIRS; do
      PATH="$d:$PATH"
    done
    export PATH
    echo "Prepended discovered OPAM bin dirs to PATH:"
    for d in $BIN_DIRS; do printf '  %s\n' "$d"; done
  fi
fi

# Debug print
echo "---- ENTRYPOINT DEBUG ----"
echo "OPAMROOT=$OPAMROOT"
echo "SWITCH=${SWITCH:-(none)}"
echo "PATH=$PATH"
echo "CAML_LD_LIBRARY_PATH=${CAML_LD_LIBRARY_PATH:-(unset)}"
echo "OCAML_TOPLEVEL_PATH=${OCAML_TOPLEVEL_PATH:-(unset)}"
echo "OCAMLTOP_INCLUDE_PATH=${OCAMLTOP_INCLUDE_PATH:-(unset)}"
echo "Liquidsoap binary: $(ls -l /opt/liquidsoap/liquidsoap 2>/dev/null || echo '(not found)')"
echo "Searching for stdlib.liq under OPAMROOT..."
find "$OPAMROOT" -type f -name "stdlib.liq" -print 2>/dev/null || true
echo "--------------------------"

# Final check: ensure stdlib.liq exists and export Liquidsoap-specific vars
STDLIB_PATH=$(find "$OPAMROOT" -type f -name "stdlib.liq" 2>/dev/null | head -n 1 || true)
if [ -z "$STDLIB_PATH" ]; then
  err ""
  err "ERROR: Could not locate 'stdlib.liq' under $OPAMROOT."
  err "Check that the builder created and the runtime extracted the opamroot to $OPAMROOT."
  err "Diagnostic commands to run inside the container:"
  err "  find $OPAMROOT -type f -name stdlib.liq"
  err "  opam switch list --root=$OPAMROOT --short"
  err ""
  exit 1
fi

# Derive library/share root from stdlib.liq location:
# stdlib.liq typically lives in: .../share/liquidsoap/<version>/libs/stdlib.liq
STDLIB_DIR="$(dirname "$STDLIB_PATH")"          # .../libs
LIQUIDSOAP_SHARE_ROOT="$(dirname "$STDLIB_DIR")" # .../<version>
export LIQUIDSOAP_SHARE_ROOT

# Export common names Liquidsoap may consult
export LIQUIDSOAP_LIBDIR="$LIQUIDSOAP_SHARE_ROOT/libs"
export LIQUIDSOAP_SHARE="$LIQUIDSOAP_SHARE_ROOT"

# Add OCaml stublibs to LD_LIBRARY_PATH and CAML_LD_LIBRARY_PATH
if [ -n "$SWITCH" ] && [ -d "$OPAMROOT/$SWITCH/lib/stublibs" ]; then
  export LD_LIBRARY_PATH="${LD_LIBRARY_PATH:-}:$OPAMROOT/$SWITCH/lib/stublibs"
  export CAML_LD_LIBRARY_PATH="${CAML_LD_LIBRARY_PATH:-}:$OPAMROOT/$SWITCH/lib/stublibs"
fi

echo "Exported LIQUIDSOAP_SHARE_ROOT=$LIQUIDSOAP_SHARE_ROOT"
echo "Exported LIQUIDSOAP_LIBDIR=$LIQUIDSOAP_LIBDIR"
echo "Exported LIQUIDSOAP_SHARE=$LIQUIDSOAP_SHARE"

# Removed problematic exec line. The execution command is now defined in docker-compose.yml.
# This simple exec runs the CMD/command defined in the docker-compose file.
exec "$@"