enum ChunkType {
    ResNull = 0x0001,
    ResStringPool = 0x0001,
    ResTable = 0x0002,
    ResXml = 0x0003,
    ResXmlFirstChunk = 0x0100,
    ResXmlStartNamespace = 0x0100,
    ResXmlEndNamespace = 0x0101,
    ResXmlStartElement = 0x0102,
    ResXmlEndElement = 0x0103,
    ResXmlCdata = 0x0104,
    ResXmlLastChunk = 0x017f,
    ResXmlResourceMap = 0x0180,
    ResTablePackage = 0x0200,
    ResTableType = 0x0201,
    ResTableTypeSpec = 0x0202,
    ResTableLibrary = 0x0203,
}

enum ComplexUnit {
    Px = 0,
    Dip = 1,
    Sp = 2,
    Pt = 3,
    In = 4,
    Mm = 5,
    Fraction = 0,
    FractionParent = 1,
}

enum ValueType {
    Null = 0x00,
    Reference = 0x01,
    Attribute = 0x02,
    String = 0x03,
    Float = 0x04,
    Dimension = 0x05,
    Fraction = 0x06,
    DynamicReference = 0x07,
    FirstInt = 0x10,
    IntDec = 0x10,
    IntHex = 0x11,
    IntBoolean = 0x12,
    FirstColorInt = 0x1c,
    IntColorArgb8 = 0x1c,
    IntColorRgb8 = 0x1d,
    IntColorArgb4 = 0x1e,
    IntColorRgb4 = 0x1f,
    LastColorInt = 0x1f,
    LastInt = 0x1f,
}

interface ResourceValue {
    size: number;
    res0: number;
    dataType: number;
    data: number;
}

interface XmlNode {
    tag: string;
    attrs: Record<string, string>;
    children: XmlNode[];
    text?: string;
}

interface XmlStackItem {
    node: XmlNode;
    namespaces: Array<[number, number]>;
}

class BinaryReader {
    private readonly data: Uint8Array;
    private pos: number;

    constructor(data: Uint8Array) {
        this.data = data;
        this.pos = 0;
    }

    getPos(): number {
        return this.pos;
    }

    setPos(pos: number): void {
        this.pos = pos;
    }

    getU8(): number {
        return this.data[this.pos++];
    }

    getU16(): number {
        const val = this.data[this.pos] | (this.data[this.pos + 1] << 8);
        this.pos += 2;
        return val;
    }

    getU32(): number {
        const val =
            this.data[this.pos] |
            (this.data[this.pos + 1] << 8) |
            (this.data[this.pos + 2] << 16) |
            (this.data[this.pos + 3] << 24);
        this.pos += 4;
        return val >>> 0;
    }

    getCStr(): string {
        let result = "";
        while (this.pos < this.data.length) {
            const c = this.data[this.pos++];
            if (c === 0) break;
            result += String.fromCharCode(c);
        }
        return result;
    }

    skip(bytes: number): void {
        this.pos += bytes;
    }
}

const parseStringPool = (reader: BinaryReader): string[] => {
    reader.skip(8);
    const stringCount = reader.getU32();
    const styleCount = reader.getU32();
    const flags = reader.getU32();
    const utf8Flag = (flags & (1 << 8)) !== 0;
    const stringsStart = reader.getU32();
    reader.getU32();

    if (styleCount !== 0) {
        throw new Error("Styles are not supported");
    }

    const stringOffsets: number[] = [];
    for (let i = 0; i < stringCount; i++) {
        stringOffsets.push(reader.getU32());
    }

    const strings: string[] = [];
    for (const offset of stringOffsets) {
        reader.setPos(stringsStart + 8 + offset);

        let str = "";
        if (utf8Flag) {
            reader.getU8();
            let len = reader.getU8();
            if (len & 0x80) {
                reader.getU8();
            }
            str = reader.getCStr();
        } else {
            let len = reader.getU16();
            if (len & 0x8000) {
                len = ((len & 0x7fff) << 16) | reader.getU16();
            }
            const chars: number[] = [];
            for (let i = 0; i < len; i++) {
                chars.push(reader.getU16());
            }
            str = String.fromCharCode(...chars);
        }
        strings.push(str);
    }

    return strings;
};

const parseResourceMap = (reader: BinaryReader, headerSize: number): number[] => {
    const attrNamesResIds: number[] = [];
    const count = (headerSize - 8) / 4;
    for (let i = 0; i < count; i++) {
        attrNamesResIds.push(reader.getU32());
    }
    return attrNamesResIds;
};

const attrNames = [
    "theme",
    "label",
    "icon",
    "name",
    "manageSpaceActivity",
    "allowClearUserData",
    "permission",
    "readPermission",
    "writePermission",
    "protectionLevel",
    "permissionGroup",
    "sharedUserId",
    "hasCode",
    "persistent",
    "enabled",
    "debuggable",
    "exported",
    "process",
    "taskAffinity",
    "multiprocess",
    "finishOnTaskLaunch",
    "clearTaskOnLaunch",
    "stateNotNeeded",
    "excludeFromRecents",
    "authorities",
    "syncable",
    "initOrder",
    "grantUriPermissions",
    "priority",
    "launchMode",
    "screenOrientation",
    "configChanges",
    "description",
    "targetPackage",
    "handleProfiling",
    "functionalTest",
    "value",
    "resource",
    "mimeType",
    "scheme",
    "host",
    "port",
    "path",
    "pathPrefix",
    "pathPattern",
    "action",
    "data",
    "targetClass",
    "colorForeground",
    "colorBackground",
    "backgroundDimAmount",
    "disabledAlpha",
    "textAppearance",
    "textAppearanceInverse",
    "textColorPrimary",
    "textColorPrimaryDisableOnly",
    "textColorSecondary",
    "textColorPrimaryInverse",
    "textColorSecondaryInverse",
    "textColorPrimaryNoDisable",
    "textColorSecondaryNoDisable",
    "textColorPrimaryInverseNoDisable",
    "textColorSecondaryInverseNoDisable",
    "textColorHintInverse",
    "textAppearanceLarge",
    "textAppearanceMedium",
    "textAppearanceSmall",
    "textAppearanceLargeInverse",
    "textAppearanceMediumInverse",
    "textAppearanceSmallInverse",
    "textCheckMark",
    "textCheckMarkInverse",
    "buttonStyle",
    "buttonStyleSmall",
    "buttonStyleInset",
    "buttonStyleToggle",
    "galleryItemBackground",
    "listPreferredItemHeight",
    "expandableListPreferredItemPaddingLeft",
    "expandableListPreferredChildPaddingLeft",
    "expandableListPreferredItemIndicatorLeft",
    "expandableListPreferredItemIndicatorRight",
    "expandableListPreferredChildIndicatorLeft",
    "expandableListPreferredChildIndicatorRight",
    "windowBackground",
    "windowFrame",
    "windowNoTitle",
    "windowIsFloating",
    "windowIsTranslucent",
    "windowContentOverlay",
    "windowTitleSize",
    "windowTitleStyle",
    "windowTitleBackgroundStyle",
    "alertDialogStyle",
    "panelBackground",
    "panelFullBackground",
    "panelColorForeground",
    "panelColorBackground",
    "panelTextAppearance",
    "scrollbarSize",
    "scrollbarThumbHorizontal",
    "scrollbarThumbVertical",
    "scrollbarTrackHorizontal",
    "scrollbarTrackVertical",
    "scrollbarAlwaysDrawHorizontalTrack",
    "scrollbarAlwaysDrawVerticalTrack",
    "absListViewStyle",
    "autoCompleteTextViewStyle",
    "checkboxStyle",
    "dropDownListViewStyle",
    "editTextStyle",
    "expandableListViewStyle",
    "galleryStyle",
    "gridViewStyle",
    "imageButtonStyle",
    "imageWellStyle",
    "listViewStyle",
    "listViewWhiteStyle",
    "popupWindowStyle",
    "progressBarStyle",
    "progressBarStyleHorizontal",
    "progressBarStyleSmall",
    "progressBarStyleLarge",
    "seekBarStyle",
    "ratingBarStyle",
    "ratingBarStyleSmall",
    "radioButtonStyle",
    "scrollbarStyle",
    "scrollViewStyle",
    "spinnerStyle",
    "starStyle",
    "tabWidgetStyle",
    "textViewStyle",
    "webViewStyle",
    "dropDownItemStyle",
    "spinnerDropDownItemStyle",
    "dropDownHintAppearance",
    "spinnerItemStyle",
    "mapViewStyle",
    "preferenceScreenStyle",
    "preferenceCategoryStyle",
    "preferenceInformationStyle",
    "preferenceStyle",
    "checkBoxPreferenceStyle",
    "yesNoPreferenceStyle",
    "dialogPreferenceStyle",
    "editTextPreferenceStyle",
    "ringtonePreferenceStyle",
    "preferenceLayoutChild",
    "textSize",
    "typeface",
    "textStyle",
    "textColor",
    "textColorHighlight",
    "textColorHint",
    "textColorLink",
    "state_focused",
    "state_window_focused",
    "state_enabled",
    "state_checkable",
    "state_checked",
    "state_selected",
    "state_active",
    "state_single",
    "state_first",
    "state_middle",
    "state_last",
    "state_pressed",
    "state_expanded",
    "state_empty",
    "state_above_anchor",
    "ellipsize",
    "x",
    "y",
    "windowAnimationStyle",
    "gravity",
    "autoLink",
    "linksClickable",
    "entries",
    "layout_gravity",
    "windowEnterAnimation",
    "windowExitAnimation",
    "windowShowAnimation",
    "windowHideAnimation",
    "activityOpenEnterAnimation",
    "activityOpenExitAnimation",
    "activityCloseEnterAnimation",
    "activityCloseExitAnimation",
    "taskOpenEnterAnimation",
    "taskOpenExitAnimation",
    "taskCloseEnterAnimation",
    "taskCloseExitAnimation",
    "taskToFrontEnterAnimation",
    "taskToFrontExitAnimation",
    "taskToBackEnterAnimation",
    "taskToBackExitAnimation",
    "orientation",
    "keycode",
    "fullDark",
    "topDark",
    "centerDark",
    "bottomDark",
    "fullBright",
    "topBright",
    "centerBright",
    "bottomBright",
    "bottomMedium",
    "centerMedium",
    "id",
    "tag",
    "scrollX",
    "scrollY",
    "background",
    "padding",
    "paddingLeft",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "focusable",
    "focusableInTouchMode",
    "visibility",
    "fitsSystemWindows",
    "scrollbars",
    "fadingEdge",
    "fadingEdgeLength",
    "nextFocusLeft",
    "nextFocusRight",
    "nextFocusUp",
    "nextFocusDown",
    "clickable",
    "longClickable",
    "saveEnabled",
    "drawingCacheQuality",
    "duplicateParentState",
    "clipChildren",
    "clipToPadding",
    "layoutAnimation",
    "animationCache",
    "persistentDrawingCache",
    "alwaysDrawnWithCache",
    "addStatesFromChildren",
    "descendantFocusability",
    "layout",
    "inflatedId",
    "layout_width",
    "layout_height",
    "layout_margin",
    "layout_marginLeft",
    "layout_marginTop",
    "layout_marginRight",
    "layout_marginBottom",
    "listSelector",
    "drawSelectorOnTop",
    "stackFromBottom",
    "scrollingCache",
    "textFilterEnabled",
    "transcriptMode",
    "cacheColorHint",
    "dial",
    "hand_hour",
    "hand_minute",
    "format",
    "checked",
    "button",
    "checkMark",
    "foreground",
    "measureAllChildren",
    "groupIndicator",
    "childIndicator",
    "indicatorLeft",
    "indicatorRight",
    "childIndicatorLeft",
    "childIndicatorRight",
    "childDivider",
    "animationDuration",
    "spacing",
    "horizontalSpacing",
    "verticalSpacing",
    "stretchMode",
    "columnWidth",
    "numColumns",
    "src",
    "antialias",
    "filter",
    "dither",
    "scaleType",
    "adjustViewBounds",
    "maxWidth",
    "maxHeight",
    "tint",
    "baselineAlignBottom",
    "cropToPadding",
    "textOn",
    "textOff",
    "baselineAligned",
    "baselineAlignedChildIndex",
    "weightSum",
    "divider",
    "dividerHeight",
    "choiceMode",
    "itemTextAppearance",
    "horizontalDivider",
    "verticalDivider",
    "headerBackground",
    "itemBackground",
    "itemIconDisabledAlpha",
    "rowHeight",
    "maxRows",
    "maxItemsPerRow",
    "moreIcon",
    "max",
    "progress",
    "secondaryProgress",
    "indeterminate",
    "indeterminateOnly",
    "indeterminateDrawable",
    "progressDrawable",
    "indeterminateDuration",
    "indeterminateBehavior",
    "minWidth",
    "minHeight",
    "interpolator",
    "thumb",
    "thumbOffset",
    "numStars",
    "rating",
    "stepSize",
    "isIndicator",
    "checkedButton",
    "stretchColumns",
    "shrinkColumns",
    "collapseColumns",
    "layout_column",
    "layout_span",
    "bufferType",
    "text",
    "hint",
    "textScaleX",
    "cursorVisible",
    "maxLines",
    "lines",
    "height",
    "minLines",
    "maxEms",
    "ems",
    "width",
    "minEms",
    "scrollHorizontally",
    "password",
    "singleLine",
    "selectAllOnFocus",
    "includeFontPadding",
    "maxLength",
    "shadowColor",
    "shadowDx",
    "shadowDy",
    "shadowRadius",
    "numeric",
    "digits",
    "phoneNumber",
    "inputMethod",
    "capitalize",
    "autoText",
    "editable",
    "freezesText",
    "drawableTop",
    "drawableBottom",
    "drawableLeft",
    "drawableRight",
    "drawablePadding",
    "completionHint",
    "completionHintView",
    "completionThreshold",
    "dropDownSelector",
    "popupBackground",
    "inAnimation",
    "outAnimation",
    "flipInterval",
    "fillViewport",
    "prompt",
    "startYear",
    "endYear",
    "mode",
    "layout_x",
    "layout_y",
    "layout_weight",
    "layout_toLeftOf",
    "layout_toRightOf",
    "layout_above",
    "layout_below",
    "layout_alignBaseline",
    "layout_alignLeft",
    "layout_alignTop",
    "layout_alignRight",
    "layout_alignBottom",
    "layout_alignParentLeft",
    "layout_alignParentTop",
    "layout_alignParentRight",
    "layout_alignParentBottom",
    "layout_centerInParent",
    "layout_centerHorizontal",
    "layout_centerVertical",
    "layout_alignWithParentIfMissing",
    "layout_scale",
    "visible",
    "variablePadding",
    "constantSize",
    "oneshot",
    "duration",
    "drawable",
    "shape",
    "innerRadiusRatio",
    "thicknessRatio",
    "startColor",
    "endColor",
    "useLevel",
    "angle",
    "type",
    "centerX",
    "centerY",
    "gradientRadius",
    "color",
    "dashWidth",
    "dashGap",
    "radius",
    "topLeftRadius",
    "topRightRadius",
    "bottomLeftRadius",
    "bottomRightRadius",
    "left",
    "top",
    "right",
    "bottom",
    "minLevel",
    "maxLevel",
    "fromDegrees",
    "toDegrees",
    "pivotX",
    "pivotY",
    "insetLeft",
    "insetRight",
    "insetTop",
    "insetBottom",
    "shareInterpolator",
    "fillBefore",
    "fillAfter",
    "startOffset",
    "repeatCount",
    "repeatMode",
    "zAdjustment",
    "fromXScale",
    "toXScale",
    "fromYScale",
    "toYScale",
    "fromXDelta",
    "toXDelta",
    "fromYDelta",
    "toYDelta",
    "fromAlpha",
    "toAlpha",
    "delay",
    "animation",
    "animationOrder",
    "columnDelay",
    "rowDelay",
    "direction",
    "directionPriority",
    "factor",
    "cycles",
    "searchMode",
    "searchSuggestAuthority",
    "searchSuggestPath",
    "searchSuggestSelection",
    "searchSuggestIntentAction",
    "searchSuggestIntentData",
    "queryActionMsg",
    "suggestActionMsg",
    "suggestActionMsgColumn",
    "menuCategory",
    "orderInCategory",
    "checkableBehavior",
    "title",
    "titleCondensed",
    "alphabeticShortcut",
    "numericShortcut",
    "checkable",
    "selectable",
    "orderingFromXml",
    "key",
    "summary",
    "order",
    "widgetLayout",
    "dependency",
    "defaultValue",
    "shouldDisableView",
    "summaryOn",
    "summaryOff",
    "disableDependentsState",
    "dialogTitle",
    "dialogMessage",
    "dialogIcon",
    "positiveButtonText",
    "negativeButtonText",
    "dialogLayout",
    "entryValues",
    "ringtoneType",
    "showDefault",
    "showSilent",
    "scaleWidth",
    "scaleHeight",
    "scaleGravity",
    "ignoreGravity",
    "foregroundGravity",
    "tileMode",
    "targetActivity",
    "alwaysRetainTaskState",
    "allowTaskReparenting",
    "searchButtonText",
    "colorForegroundInverse",
    "textAppearanceButton",
    "listSeparatorTextViewStyle",
    "streamType",
    "clipOrientation",
    "centerColor",
    "minSdkVersion",
    "windowFullscreen",
    "unselectedAlpha",
    "progressBarStyleSmallTitle",
    "ratingBarStyleIndicator",
    "apiKey",
    "textColorTertiary",
    "textColorTertiaryInverse",
    "listDivider",
    "soundEffectsEnabled",
    "keepScreenOn",
    "lineSpacingExtra",
    "lineSpacingMultiplier",
    "listChoiceIndicatorSingle",
    "listChoiceIndicatorMultiple",
    "versionCode",
    "versionName",
    "marqueeRepeatLimit",
    "windowNoDisplay",
    "backgroundDimEnabled",
    "inputType",
    "isDefault",
    "windowDisablePreview",
    "privateImeOptions",
    "editorExtras",
    "settingsActivity",
    "fastScrollEnabled",
    "reqTouchScreen",
    "reqKeyboardType",
    "reqHardKeyboard",
    "reqNavigation",
    "windowSoftInputMode",
    "imeFullscreenBackground",
    "noHistory",
    "headerDividersEnabled",
    "footerDividersEnabled",
    "candidatesTextStyleSpans",
    "smoothScrollbar",
    "reqFiveWayNav",
    "keyBackground",
    "keyTextSize",
    "labelTextSize",
    "keyTextColor",
    "keyPreviewLayout",
    "keyPreviewOffset",
    "keyPreviewHeight",
    "verticalCorrection",
    "popupLayout",
    "state_long_pressable",
    "keyWidth",
    "keyHeight",
    "horizontalGap",
    "verticalGap",
    "rowEdgeFlags",
    "codes",
    "popupKeyboard",
    "popupCharacters",
    "keyEdgeFlags",
    "isModifier",
    "isSticky",
    "isRepeatable",
    "iconPreview",
    "keyOutputText",
    "keyLabel",
    "keyIcon",
    "keyboardMode",
    "isScrollContainer",
    "fillEnabled",
    "updatePeriodMillis",
    "initialLayout",
    "voiceSearchMode",
    "voiceLanguageModel",
    "voicePromptText",
    "voiceLanguage",
    "voiceMaxResults",
    "bottomOffset",
    "topOffset",
    "allowSingleTap",
    "handle",
    "content",
    "animateOnClick",
    "configure",
    "hapticFeedbackEnabled",
    "innerRadius",
    "thickness",
    "sharedUserLabel",
    "dropDownWidth",
    "dropDownAnchor",
    "imeOptions",
    "imeActionLabel",
    "imeActionId",
    "UNKNOWN",
    "imeExtractEnterAnimation",
    "imeExtractExitAnimation",
    "tension",
    "extraTension",
    "anyDensity",
    "searchSuggestThreshold",
    "includeInGlobalSearch",
    "onClick",
    "targetSdkVersion",
    "maxSdkVersion",
    "testOnly",
    "contentDescription",
    "gestureStrokeWidth",
    "gestureColor",
    "uncertainGestureColor",
    "fadeOffset",
    "fadeDuration",
    "gestureStrokeType",
    "gestureStrokeLengthThreshold",
    "gestureStrokeSquarenessThreshold",
    "gestureStrokeAngleThreshold",
    "eventsInterceptionEnabled",
    "fadeEnabled",
    "backupAgent",
    "allowBackup",
    "glEsVersion",
    "queryAfterZeroResults",
    "dropDownHeight",
    "smallScreens",
    "normalScreens",
    "largeScreens",
    "progressBarStyleInverse",
    "progressBarStyleSmallInverse",
    "progressBarStyleLargeInverse",
    "searchSettingsDescription",
    "textColorPrimaryInverseDisableOnly",
    "autoUrlDetect",
    "resizeable",
    "required",
    "accountType",
    "contentAuthority",
    "userVisible",
    "windowShowWallpaper",
    "wallpaperOpenEnterAnimation",
    "wallpaperOpenExitAnimation",
    "wallpaperCloseEnterAnimation",
    "wallpaperCloseExitAnimation",
    "wallpaperIntraOpenEnterAnimation",
    "wallpaperIntraOpenExitAnimation",
    "wallpaperIntraCloseEnterAnimation",
    "wallpaperIntraCloseExitAnimation",
    "supportsUploading",
    "killAfterRestore",
    "restoreNeedsApplication",
    "smallIcon",
    "accountPreferences",
    "textAppearanceSearchResultSubtitle",
    "textAppearanceSearchResultTitle",
    "summaryColumn",
    "detailColumn",
    "detailSocialSummary",
    "thumbnail",
    "detachWallpaper",
    "finishOnCloseSystemDialogs",
    "scrollbarFadeDuration",
    "scrollbarDefaultDelayBeforeFade",
    "fadeScrollbars",
    "colorBackgroundCacheHint",
    "dropDownHorizontalOffset",
    "dropDownVerticalOffset",
    "quickContactBadgeStyleWindowSmall",
    "quickContactBadgeStyleWindowMedium",
    "quickContactBadgeStyleWindowLarge",
    "quickContactBadgeStyleSmallWindowSmall",
    "quickContactBadgeStyleSmallWindowMedium",
    "quickContactBadgeStyleSmallWindowLarge",
    "author",
    "autoStart",
    "expandableListViewWhiteStyle",
    "installLocation",
    "vmSafeMode",
    "webTextViewStyle",
    "restoreAnyVersion",
    "tabStripLeft",
    "tabStripRight",
    "tabStripEnabled",
    "logo",
    "xlargeScreens",
    "immersive",
    "overScrollMode",
    "overScrollHeader",
    "overScrollFooter",
    "filterTouchesWhenObscured",
    "textSelectHandleLeft",
    "textSelectHandleRight",
    "textSelectHandle",
    "textSelectHandleWindowStyle",
    "popupAnimationStyle",
    "screenSize",
    "screenDensity",
    "allContactsName",
    "windowActionBar",
    "actionBarStyle",
    "navigationMode",
    "displayOptions",
    "subtitle",
    "customNavigationLayout",
    "hardwareAccelerated",
    "measureWithLargestChild",
    "animateFirstView",
    "dropDownSpinnerStyle",
    "actionDropDownStyle",
    "actionButtonStyle",
    "showAsAction",
    "previewImage",
    "actionModeBackground",
    "actionModeCloseDrawable",
    "windowActionModeOverlay",
    "valueFrom",
    "valueTo",
    "valueType",
    "propertyName",
    "ordering",
    "fragment",
    "windowActionBarOverlay",
    "fragmentOpenEnterAnimation",
    "fragmentOpenExitAnimation",
    "fragmentCloseEnterAnimation",
    "fragmentCloseExitAnimation",
    "fragmentFadeEnterAnimation",
    "fragmentFadeExitAnimation",
    "actionBarSize",
    "imeSubtypeLocale",
    "imeSubtypeMode",
    "imeSubtypeExtraValue",
    "splitMotionEvents",
    "listChoiceBackgroundIndicator",
    "spinnerMode",
    "animateLayoutChanges",
    "actionBarTabStyle",
    "actionBarTabBarStyle",
    "actionBarTabTextStyle",
    "actionOverflowButtonStyle",
    "actionModeCloseButtonStyle",
    "titleTextStyle",
    "subtitleTextStyle",
    "iconifiedByDefault",
    "actionLayout",
    "actionViewClass",
    "activatedBackgroundIndicator",
    "state_activated",
    "listPopupWindowStyle",
    "popupMenuStyle",
    "textAppearanceLargePopupMenu",
    "textAppearanceSmallPopupMenu",
    "breadCrumbTitle",
    "breadCrumbShortTitle",
    "listDividerAlertDialog",
    "textColorAlertDialogListItem",
    "loopViews",
    "dialogTheme",
    "alertDialogTheme",
    "dividerVertical",
    "homeAsUpIndicator",
    "enterFadeDuration",
    "exitFadeDuration",
    "selectableItemBackground",
    "autoAdvanceViewId",
    "useIntrinsicSizeAsMinimum",
    "actionModeCutDrawable",
    "actionModeCopyDrawable",
    "actionModePasteDrawable",
    "textEditPasteWindowLayout",
    "textEditNoPasteWindowLayout",
    "textIsSelectable",
    "windowEnableSplitTouch",
    "indeterminateProgressStyle",
    "progressBarPadding",
    "animationResolution",
    "state_accelerated",
    "baseline",
    "homeLayout",
    "opacity",
    "alpha",
    "transformPivotX",
    "transformPivotY",
    "translationX",
    "translationY",
    "scaleX",
    "scaleY",
    "rotation",
    "rotationX",
    "rotationY",
    "showDividers",
    "dividerPadding",
    "borderlessButtonStyle",
    "dividerHorizontal",
    "itemPadding",
    "buttonBarStyle",
    "buttonBarButtonStyle",
    "segmentedButtonStyle",
    "staticWallpaperPreview",
    "allowParallelSyncs",
    "isAlwaysSyncable",
    "verticalScrollbarPosition",
    "fastScrollAlwaysVisible",
    "fastScrollThumbDrawable",
    "fastScrollPreviewBackgroundLeft",
    "fastScrollPreviewBackgroundRight",
    "fastScrollTrackDrawable",
    "fastScrollOverlayPosition",
    "customTokens",
    "nextFocusForward",
    "firstDayOfWeek",
    "showWeekNumber",
    "minDate",
    "maxDate",
    "shownWeekCount",
    "selectedWeekBackgroundColor",
    "focusedMonthDateColor",
    "unfocusedMonthDateColor",
    "weekNumberColor",
    "weekSeparatorLineColor",
    "selectedDateVerticalBar",
    "weekDayTextAppearance",
    "dateTextAppearance",
    "UNKNOWN",
    "spinnersShown",
    "calendarViewShown",
    "state_multiline",
    "detailsElementBackground",
    "textColorHighlightInverse",
    "textColorLinkInverse",
    "editTextColor",
    "editTextBackground",
    "horizontalScrollViewStyle",
    "layerType",
    "alertDialogIcon",
    "windowMinWidthMajor",
    "windowMinWidthMinor",
    "queryHint",
    "fastScrollTextColor",
    "largeHeap",
    "windowCloseOnTouchOutside",
    "datePickerStyle",
    "calendarViewStyle",
    "textEditSidePasteWindowLayout",
    "textEditSideNoPasteWindowLayout",
    "actionMenuTextAppearance",
    "actionMenuTextColor",
    "textCursorDrawable",
    "resizeMode",
    "requiresSmallestWidthDp",
    "compatibleWidthLimitDp",
    "largestWidthLimitDp",
    "state_hovered",
    "state_drag_can_accept",
    "state_drag_hovered",
    "stopWithTask",
    "switchTextOn",
    "switchTextOff",
    "switchPreferenceStyle",
    "switchTextAppearance",
    "track",
    "switchMinWidth",
    "switchPadding",
    "thumbTextPadding",
    "textSuggestionsWindowStyle",
    "textEditSuggestionItemLayout",
    "rowCount",
    "rowOrderPreserved",
    "columnCount",
    "columnOrderPreserved",
    "useDefaultMargins",
    "alignmentMode",
    "layout_row",
    "layout_rowSpan",
    "layout_columnSpan",
    "actionModeSelectAllDrawable",
    "isAuxiliary",
    "accessibilityEventTypes",
    "packageNames",
    "accessibilityFeedbackType",
    "notificationTimeout",
    "accessibilityFlags",
    "canRetrieveWindowContent",
    "listPreferredItemHeightLarge",
    "listPreferredItemHeightSmall",
    "actionBarSplitStyle",
    "actionProviderClass",
    "backgroundStacked",
    "backgroundSplit",
    "textAllCaps",
    "colorPressedHighlight",
    "colorLongPressedHighlight",
    "colorFocusedHighlight",
    "colorActivatedHighlight",
    "colorMultiSelectHighlight",
    "drawableStart",
    "drawableEnd",
    "actionModeStyle",
    "minResizeWidth",
    "minResizeHeight",
    "actionBarWidgetTheme",
    "uiOptions",
    "subtypeLocale",
    "subtypeExtraValue",
    "actionBarDivider",
    "actionBarItemBackground",
    "actionModeSplitBackground",
    "textAppearanceListItem",
    "textAppearanceListItemSmall",
    "targetDescriptions",
    "directionDescriptions",
    "overridesImplicitlyEnabledSubtype",
    "listPreferredItemPaddingLeft",
    "listPreferredItemPaddingRight",
    "requiresFadingEdge",
    "publicKey",
    "parentActivityName",
    "UNKNOWN",
    "isolatedProcess",
    "importantForAccessibility",
    "keyboardLayout",
    "fontFamily",
    "mediaRouteButtonStyle",
    "mediaRouteTypes",
    "supportsRtl",
    "textDirection",
    "textAlignment",
    "layoutDirection",
    "paddingStart",
    "paddingEnd",
    "layout_marginStart",
    "layout_marginEnd",
    "layout_toStartOf",
    "layout_toEndOf",
    "layout_alignStart",
    "layout_alignEnd",
    "layout_alignParentStart",
    "layout_alignParentEnd",
    "listPreferredItemPaddingStart",
    "listPreferredItemPaddingEnd",
    "singleUser",
    "presentationTheme",
    "subtypeId",
    "initialKeyguardLayout",
    "UNKNOWN",
    "widgetCategory",
    "permissionGroupFlags",
    "labelFor",
    "permissionFlags",
    "checkedTextViewStyle",
    "showOnLockScreen",
    "format12Hour",
    "format24Hour",
    "timeZone",
    "mipMap",
    "mirrorForRtl",
    "windowOverscan",
    "requiredForAllUsers",
    "indicatorStart",
    "indicatorEnd",
    "childIndicatorStart",
    "childIndicatorEnd",
    "restrictedAccountType",
    "requiredAccountType",
    "canRequestTouchExplorationMode",
    "canRequestEnhancedWebAccessibility",
    "canRequestFilterKeyEvents",
    "layoutMode",
    "keySet",
    "targetId",
    "fromScene",
    "toScene",
    "transition",
    "transitionOrdering",
    "fadingMode",
    "startDelay",
    "ssp",
    "sspPrefix",
    "sspPattern",
    "addPrintersActivity",
    "vendor",
    "category",
    "isAsciiCapable",
    "autoMirrored",
    "supportsSwitchingToNextInputMethod",
    "requireDeviceUnlock",
    "apduServiceBanner",
    "accessibilityLiveRegion",
    "windowTranslucentStatus",
    "windowTranslucentNavigation",
    "advancedPrintOptionsActivity",
    "banner",
    "windowSwipeToDismiss",
    "isGame",
    "allowEmbedded",
    "setupActivity",
    "fastScrollStyle",
    "windowContentTransitions",
    "windowContentTransitionManager",
    "translationZ",
    "tintMode",
    "controlX1",
    "controlY1",
    "controlX2",
    "controlY2",
    "transitionName",
    "transitionGroup",
    "viewportWidth",
    "viewportHeight",
    "fillColor",
    "pathData",
    "strokeColor",
    "strokeWidth",
    "trimPathStart",
    "trimPathEnd",
    "trimPathOffset",
    "strokeLineCap",
    "strokeLineJoin",
    "strokeMiterLimit",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "colorControlNormal",
    "colorControlActivated",
    "colorButtonNormal",
    "colorControlHighlight",
    "persistableMode",
    "titleTextAppearance",
    "subtitleTextAppearance",
    "slideEdge",
    "actionBarTheme",
    "textAppearanceListItemSecondary",
    "colorPrimary",
    "colorPrimaryDark",
    "colorAccent",
    "nestedScrollingEnabled",
    "windowEnterTransition",
    "windowExitTransition",
    "windowSharedElementEnterTransition",
    "windowSharedElementExitTransition",
    "windowAllowReturnTransitionOverlap",
    "windowAllowEnterTransitionOverlap",
    "sessionService",
    "stackViewStyle",
    "switchStyle",
    "elevation",
    "excludeId",
    "excludeClass",
    "hideOnContentScroll",
    "actionOverflowMenuStyle",
    "documentLaunchMode",
    "maxRecents",
    "autoRemoveFromRecents",
    "stateListAnimator",
    "toId",
    "fromId",
    "reversible",
    "splitTrack",
    "targetName",
    "excludeName",
    "matchOrder",
    "windowDrawsSystemBarBackgrounds",
    "statusBarColor",
    "navigationBarColor",
    "contentInsetStart",
    "contentInsetEnd",
    "contentInsetLeft",
    "contentInsetRight",
    "paddingMode",
    "layout_rowWeight",
    "layout_columnWeight",
    "translateX",
    "translateY",
    "selectableItemBackgroundBorderless",
    "elegantTextHeight",
    "UNKNOWN",
    "UNKNOWN",
    "UNKNOWN",
    "windowTransitionBackgroundFadeDuration",
    "overlapAnchor",
    "progressTint",
    "progressTintMode",
    "progressBackgroundTint",
    "progressBackgroundTintMode",
    "secondaryProgressTint",
    "secondaryProgressTintMode",
    "indeterminateTint",
    "indeterminateTintMode",
    "backgroundTint",
    "backgroundTintMode",
    "foregroundTint",
    "foregroundTintMode",
    "buttonTint",
    "buttonTintMode",
    "thumbTint",
    "thumbTintMode",
    "fullBackupOnly",
    "propertyXName",
    "propertyYName",
    "relinquishTaskIdentity",
    "tileModeX",
    "tileModeY",
    "actionModeShareDrawable",
    "actionModeFindDrawable",
    "actionModeWebSearchDrawable",
    "transitionVisibilityMode",
    "minimumHorizontalAngle",
    "minimumVerticalAngle",
    "maximumAngle",
    "searchViewStyle",
    "closeIcon",
    "goIcon",
    "searchIcon",
    "voiceIcon",
    "commitIcon",
    "suggestionRowLayout",
    "queryBackground",
    "submitBackground",
    "buttonBarPositiveButtonStyle",
    "buttonBarNeutralButtonStyle",
    "buttonBarNegativeButtonStyle",
    "popupElevation",
    "actionBarPopupTheme",
    "multiArch",
    "touchscreenBlocksFocus",
    "windowElevation",
    "launchTaskBehindTargetAnimation",
    "launchTaskBehindSourceAnimation",
    "restrictionType",
    "dayOfWeekBackground",
    "dayOfWeekTextAppearance",
    "headerMonthTextAppearance",
    "headerDayOfMonthTextAppearance",
    "headerYearTextAppearance",
    "yearListItemTextAppearance",
    "yearListSelectorColor",
    "calendarTextColor",
    "recognitionService",
    "timePickerStyle",
    "timePickerDialogTheme",
    "headerTimeTextAppearance",
    "headerAmPmTextAppearance",
    "numbersTextColor",
    "numbersBackgroundColor",
    "numbersSelectorColor",
    "amPmTextColor",
    "amPmBackgroundColor",
    "UNKNOWN",
    "checkMarkTint",
    "checkMarkTintMode",
    "popupTheme",
    "toolbarStyle",
    "windowClipToOutline",
    "datePickerDialogTheme",
    "showText",
    "windowReturnTransition",
    "windowReenterTransition",
    "windowSharedElementReturnTransition",
    "windowSharedElementReenterTransition",
    "resumeWhilePausing",
    "datePickerMode",
    "timePickerMode",
    "inset",
    "letterSpacing",
    "fontFeatureSettings",
    "outlineProvider",
    "contentAgeHint",
    "country",
    "windowSharedElementsUseOverlay",
    "reparent",
    "reparentWithOverlay",
    "ambientShadowAlpha",
    "spotShadowAlpha",
    "navigationIcon",
    "navigationContentDescription",
    "fragmentExitTransition",
    "fragmentEnterTransition",
    "fragmentSharedElementEnterTransition",
    "fragmentReturnTransition",
    "fragmentSharedElementReturnTransition",
    "fragmentReenterTransition",
    "fragmentAllowEnterTransitionOverlap",
    "fragmentAllowReturnTransitionOverlap",
    "patternPathData",
    "strokeAlpha",
    "fillAlpha",
    "windowActivityTransitions",
    "colorEdgeEffect",
    "resizeClip",
    "collapseContentDescription",
    "accessibilityTraversalBefore",
    "accessibilityTraversalAfter",
    "dialogPreferredPadding",
    "searchHintIcon",
    "revisionCode",
    "drawableTint",
    "drawableTintMode",
    "fraction",
    "trackTint",
    "trackTintMode",
    "start",
    "end",
    "breakStrategy",
    "hyphenationFrequency",
    "allowUndo",
    "windowLightStatusBar",
    "numbersInnerTextColor",
    "colorBackgroundFloating",
    "titleTextColor",
    "subtitleTextColor",
    "thumbPosition",
    "scrollIndicators",
    "contextClickable",
    "fingerprintAuthDrawable",
    "logoDescription",
    "extractNativeLibs",
    "fullBackupContent",
    "usesCleartextTraffic",
    "lockTaskMode",
    "autoVerify",
    "showForAllUsers",
    "supportsAssist",
    "supportsLaunchVoiceAssistFromKeyguard",
    "listMenuViewStyle",
    "subMenuArrow",
    "defaultWidth",
    "defaultHeight",
    "resizeableActivity",
    "supportsPictureInPicture",
    "titleMargin",
    "titleMarginStart",
    "titleMarginEnd",
    "titleMarginTop",
    "titleMarginBottom",
    "maxButtonHeight",
    "buttonGravity",
    "collapseIcon",
    "level",
    "contextPopupMenuStyle",
    "textAppearancePopupMenuHeader",
    "windowBackgroundFallback",
    "defaultToDeviceProtectedStorage",
    "directBootAware",
    "preferenceFragmentStyle",
    "canControlMagnification",
    "languageTag",
    "pointerIcon",
    "tickMark",
    "tickMarkTint",
    "tickMarkTintMode",
    "canPerformGestures",
    "externalService",
    "supportsLocalInteraction",
    "startX",
    "startY",
    "endX",
    "endY",
    "offset",
    "use32bitAbi",
    "bitmap",
    "hotSpotX",
    "hotSpotY",
    "version",
    "backupInForeground",
    "countDown",
    "canRecord",
    "tunerCount",
    "fillType",
    "popupEnterTransition",
    "popupExitTransition",
    "forceHasOverlappingRendering",
    "contentInsetStartWithNavigation",
    "contentInsetEndWithActions",
    "numberPickerStyle",
    "enableVrMode",
    "UNKNOWN",
    "networkSecurityConfig",
    "shortcutId",
    "shortcutShortLabel",
    "shortcutLongLabel",
    "shortcutDisabledMessage",
    "roundIcon",
    "contextUri",
    "contextDescription",
    "showMetadataInPreview",
    "colorSecondary",
];

const formatResourceValue = (value: ResourceValue, strings: string[], rawVal: number): string => {
    if (rawVal !== 0xffffffff) {
        return strings[rawVal] || "";
    }

    const printComplex = (isFrac: boolean): string => {
        const mantissaMult = 1.0 / (1 << 8);
        const radixMults = [mantissaMult, mantissaMult / (1 << 7), mantissaMult / (1 << 15), mantissaMult / (1 << 23)];
        const val = ((value.data & 0xffffff00) >> 0) * radixMults[(value.data >> 4) & 0x3];

        if (isFrac) {
            const unit = value.data & 0xf;
            if (unit === ComplexUnit.Fraction) return `${val * 100}%`;
            if (unit === ComplexUnit.FractionParent) return `${val * 100}%p`;
            return `${val * 100}`;
        } else {
            const unit = value.data & 0xf;
            if (unit === ComplexUnit.Px) return `${val}px`;
            if (unit === ComplexUnit.Dip) return `${val}dip`;
            if (unit === ComplexUnit.Sp) return `${val}sp`;
            if (unit === ComplexUnit.Pt) return `${val}pt`;
            if (unit === ComplexUnit.In) return `${val}in`;
            if (unit === ComplexUnit.Mm) return `${val}mm`;
            return `${val}`;
        }
    };

    switch (value.dataType) {
        case ValueType.Null:
            return "null";
        case ValueType.Float:
            return value.data.toString();
        case ValueType.Dimension:
            return printComplex(false);
        case ValueType.Fraction:
            return printComplex(true);
        case ValueType.IntDec:
            return value.data.toString();
        case ValueType.IntHex:
            return `0x${value.data.toString(16)}`;
        case ValueType.IntBoolean:
            return value.data ? "true" : "false";
        default:
            return `type${value.dataType}/${value.data}`;
    }
};

const lookupPrefix = (uri: number, xmlStack: XmlStackItem[]): number => {
    for (let i = xmlStack.length - 1; i >= 0; i--) {
        const item = xmlStack[i];
        for (let j = item.namespaces.length - 1; j >= 0; j--) {
            if (item.namespaces[j][0] === uri) {
                return item.namespaces[j][1];
            }
        }
    }
    return 0xffffffff;
};

const nodeToXml = (node: XmlNode, indent: number = 0): string => {
    const ind = "    ".repeat(indent);
    let xml = `${ind}<${node.tag}`;

    for (const [key, value] of Object.entries(node.attrs)) {
        xml += ` ${key}="${value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}"`;
    }

    if (node.children.length === 0 && !node.text) {
        xml += " />\n";
    } else {
        xml += ">";
        if (node.text) {
            xml += node.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        if (node.children.length > 0) {
            xml += "\n";
            for (const child of node.children) {
                xml += nodeToXml(child, indent + 1);
            }
            xml += ind;
        }
        xml += `</${node.tag}>\n`;
    }

    return xml;
};

export const read = (data: Uint8Array): string => {
    const reader = new BinaryReader(data);

    if (data.length < 8) {
        throw new Error("Not a binary XML file");
    }

    const headerType = reader.getU16();
    reader.skip(2);
    const totalSize = reader.getU32();

    if (headerType !== ChunkType.ResXml) {
        throw new Error("Not a binary XML file");
    }

    let strings: string[] = [];
    let attrNamesResIds: number[] = [];
    const rootNode: XmlNode = { tag: "", attrs: {}, children: [] };
    const xmlStack: XmlStackItem[] = [{ node: rootNode, namespaces: [] }];

    while (reader.getPos() < totalSize) {
        const chunkStart = reader.getPos();
        const chunkType = reader.getU16();
        reader.skip(2);
        const chunkSize = reader.getU32();

        reader.setPos(chunkStart + 8);

        switch (chunkType) {
            case ChunkType.ResStringPool:
                reader.setPos(chunkStart);
                strings = parseStringPool(reader);
                break;

            case ChunkType.ResXmlResourceMap:
                attrNamesResIds = parseResourceMap(reader, chunkSize);
                break;

            case ChunkType.ResXmlStartNamespace: {
                reader.skip(4);
                reader.skip(4);
                const prefix = reader.getU32();
                const uri = reader.getU32();
                xmlStack[xmlStack.length - 1].namespaces.push([uri, prefix]);
                break;
            }

            case ChunkType.ResXmlEndNamespace:
                reader.skip(16);
                xmlStack[xmlStack.length - 1].namespaces.pop();
                break;

            case ChunkType.ResXmlStartElement: {
                reader.skip(4);
                reader.skip(4);
                reader.skip(4);
                const name = reader.getU32();
                reader.skip(4);
                const attributeCount = reader.getU16();
                reader.skip(6);

                const newNode: XmlNode = { tag: strings[name], attrs: {}, children: [] };

                for (const [uri, prefix] of xmlStack[xmlStack.length - 1].namespaces) {
                    newNode.attrs[`xmlns:${strings[prefix]}`] = strings[uri];
                }

                for (let i = 0; i < attributeCount; i++) {
                    const attrNs = reader.getU32();
                    const attrName = reader.getU32();
                    const attrRawVal = reader.getU32();
                    const value: ResourceValue = {
                        size: reader.getU16(),
                        res0: reader.getU8(),
                        dataType: reader.getU8(),
                        data: reader.getU32(),
                    };

                    let attrKey = "";
                    if (attrNs !== 0xffffffff) {
                        const prefix = lookupPrefix(attrNs, xmlStack);
                        if (prefix !== 0xffffffff) {
                            attrKey = `${strings[prefix]}:`;
                        }
                    }
                    attrKey += strings[attrName] || attrNames[attrNamesResIds[attrName] - 0x1010000] || "";

                    newNode.attrs[attrKey] = formatResourceValue(value, strings, attrRawVal);
                }

                xmlStack[xmlStack.length - 1].node.children.push(newNode);
                xmlStack.push({ node: newNode, namespaces: [] });
                break;
            }

            case ChunkType.ResXmlEndElement:
                reader.skip(16);
                xmlStack.pop();
                break;

            case ChunkType.ResXmlCdata: {
                reader.skip(4);
                reader.skip(4);
                const text = reader.getU32();
                reader.skip(8);
                xmlStack[xmlStack.length - 1].node.text = strings[text];
                break;
            }

            default:
                throw new Error(`Unknown chunk type 0x${chunkType.toString(16)}`);
        }

        reader.setPos(chunkStart + chunkSize);
    }

    let result = '<?xml version="1.0" encoding="utf-8"?>\n';
    for (const child of rootNode.children) {
        result += nodeToXml(child, 0);
    }
    return result;
};
