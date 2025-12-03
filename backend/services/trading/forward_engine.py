"""
DEPRECATED: This module has been refactored into a package.

This file is maintained for backward compatibility only.
Please update your imports to use the new package structure:

    from services.trading.forward_engine import ForwardEngine, SessionState

The import path remains the same, but the implementation has been
modularized into the forward_engine/ package for better maintainability.

This wrapper will be removed in a future version.
"""

import warnings

# Issue deprecation warning when this module is imported
warnings.warn(
    "Importing from 'services.trading.forward_engine' module is deprecated. "
    "The module has been refactored into a package. "
    "While imports still work, please be aware that this wrapper may be removed in a future version. "
    "The recommended import remains: from services.trading.forward_engine import ForwardEngine, SessionState",
    DeprecationWarning,
    stacklevel=2
)

# Re-export all public APIs from the new package
from services.trading.forward_engine import (
    ForwardEngine,
    SessionState,
    __version__
)

__all__ = [
    'ForwardEngine',
    'SessionState',
]
