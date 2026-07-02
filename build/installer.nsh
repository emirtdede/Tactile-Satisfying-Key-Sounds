!addincludedir build

!ifndef BUILD_UNINSTALLER
    Var TactileSetupSmallIcon
    Var TactileSetupBigIcon
    Var TactileSetupIconPrepared
    Var TactileShortcutLightIconPath
    Var TactileShortcutDarkIconPath

    !define MUI_CUSTOMFUNCTION_GUIINIT PrimeTactileSetupWindowIcon
    !define MUI_PAGE_CUSTOMFUNCTION_SHOW StartTactileSetupWindowIconRefresh

    !macro customInstallMode
    !macroend
!else
    !macro customInstallMode
    !macroend
!endif

!macro customHeader
    !ifndef BUILD_UNINSTALLER
    !define TACTILE_WM_SETICON 0x0080
    !define TACTILE_IMAGE_ICON 1
    !define TACTILE_LR_LOADFROMFILE 0x00000010

    Function PrepareTactileSetupWindowIcon
        StrCmp $TactileSetupIconPrepared "1" prepared

        InitPluginsDir
        File /oname=$PLUGINSDIR\setupWindowIcon.ico "${BUILD_RESOURCES_DIR}\setupWindowIcon.ico"

        System::Call 'user32::LoadImageW(p 0, w "$PLUGINSDIR\setupWindowIcon.ico", i ${TACTILE_IMAGE_ICON}, i 16, i 16, i ${TACTILE_LR_LOADFROMFILE}) p.r0'
        StrCpy $TactileSetupSmallIcon $0

        System::Call 'user32::LoadImageW(p 0, w "$PLUGINSDIR\setupWindowIcon.ico", i ${TACTILE_IMAGE_ICON}, i 32, i 32, i ${TACTILE_LR_LOADFROMFILE}) p.r1'
        StrCpy $TactileSetupBigIcon $1

        StrCpy $TactileSetupIconPrepared "1"
        prepared:
    FunctionEnd

    Function PrimeTactileSetupWindowIcon
        Call PrepareTactileSetupWindowIcon
        Call SetTactileSetupWindowIcon
    FunctionEnd

    Function StartTactileSetupWindowIconRefresh
        Call PrepareTactileSetupWindowIcon
        Call SetTactileSetupWindowIcon
    FunctionEnd

    Function SetTactileSetupWindowIcon
        IntCmp $TactileSetupSmallIcon 0 smallIconDone smallIconReady smallIconReady
        smallIconReady:
        SendMessage $HWNDPARENT ${TACTILE_WM_SETICON} 0 $TactileSetupSmallIcon
        smallIconDone:

        IntCmp $TactileSetupBigIcon 0 bigIconDone bigIconReady bigIconReady
        bigIconReady:
        SendMessage $HWNDPARENT ${TACTILE_WM_SETICON} 1 $TactileSetupBigIcon
        bigIconDone:
    FunctionEnd

    Function InstallTactileShortcutIconBridge
        StrCpy $TactileShortcutLightIconPath "$APPDATA\Tactile\Icons\Tactile-light.ico"
        StrCpy $TactileShortcutDarkIconPath "$APPDATA\Tactile\Icons\Tactile-bg.ico"
        CreateDirectory "$APPDATA\Tactile\Icons"
        File /oname=$TactileShortcutLightIconPath "${BUILD_RESOURCES_DIR}\installerHeaderIcon.ico"
        File /oname=$TactileShortcutDarkIconPath "${BUILD_RESOURCES_DIR}\installerIcon.ico"

        ${if} $installMode == "all"
            nsExec::ExecToLog 'icacls "$APPDATA\Tactile" /grant *S-1-5-32-545:(OI)(CI)M /T /C'
        ${endIf}

        ${if} ${FileExists} "$newStartMenuLink"
            CreateShortCut "$newStartMenuLink" "$appExe" "" "$TactileShortcutLightIconPath" 0 "" "" "${APP_DESCRIPTION}"
            ClearErrors
            WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
            nsExec::ExecToLog 'icacls "$newStartMenuLink" /grant *S-1-5-32-545:M /C'
        ${endIf}

        ${if} ${FileExists} "$newDesktopLink"
            CreateShortCut "$newDesktopLink" "$appExe" "" "$TactileShortcutLightIconPath" 0 "" "" "${APP_DESCRIPTION}"
            ClearErrors
            WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
            nsExec::ExecToLog 'icacls "$newDesktopLink" /grant *S-1-5-32-545:M /C'
        ${endIf}

        System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
    FunctionEnd
    !endif
!macroend

!macro customInstall
    SetRegView 64
    ReadRegStr $0 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" "Version"
    SetRegView 32

    StrCmp $0 '' notInstalled installed

    notInstalled:
    DetailPrint "VC++ Redistributable package is missing!"
    inetc::get "https://aka.ms/vs/17/release/vc_redist.x64.exe" $PLUGINSDIR\vcredist.exe
    DetailPrint "Installing Visual Studio Redistributable package..."
    ExecWait '"$PLUGINSDIR\vcredist.exe" /q /norestart'
    DetailPrint "Done"

    installed:
    DetailPrint "VC++ Redistributable installed"
    !ifndef BUILD_UNINSTALLER
        Call InstallTactileShortcutIconBridge
    !endif
!macroend

!macro customInit
    # Kill running instances before install
    nsExec::Exec `taskkill /F /IM Tactile.exe`
!macroend

!macro customUnInit
    # Kill running instances before uninstall
    nsExec::Exec `taskkill /F /IM Tactile.exe`
!macroend
