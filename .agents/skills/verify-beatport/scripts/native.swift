#!/usr/bin/env swift
import AppKit
import ApplicationServices

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

guard let raycast = NSRunningApplication.runningApplications(withBundleIdentifier: "com.raycast.macos").first
else { fail("Start Raycast in this macOS login session.") }
guard AXIsProcessTrusted() else { fail("Accessibility access is required to inspect Raycast.") }
let root = AXUIElementCreateApplication(raycast.processIdentifier)

func value(_ item: AXUIElement, _ key: String) -> CFTypeRef? {
    var result: CFTypeRef?
    AXUIElementCopyAttributeValue(item, key as CFString, &result)
    return result
}

func find(_ item: AXUIElement, role: String, label: String, depth: Int = 0) -> AXUIElement? {
    guard depth < 20 else { return nil }
    guard value(item, kAXRoleAttribute) as? String == role else {
        return descend(item, role: role, label: label, depth: depth)
    }
    let fields = [kAXTitleAttribute, kAXDescriptionAttribute, kAXValueAttribute].compactMap {
        value(item, $0) as? String
    }
    if fields.contains(where: {
        $0 == label || (verb == "confirm" && $0.contains(label)) || (role == kAXMenuItemRole && $0.hasPrefix(label + " "))
    }) { return item }
    return descend(item, role: role, label: label, depth: depth)
}

func descend(_ item: AXUIElement, role: String, label: String, depth: Int) -> AXUIElement? {
    for child in value(item, kAXChildrenAttribute) as? [AXUIElement] ?? [] {
        if let match = find(child, role: role, label: label, depth: depth + 1) { return match }
    }
    return nil
}

let args = Array(CommandLine.arguments.dropFirst())
if args == ["doctor"] {
    print("Raycast PID", raycast.processIdentifier, "Accessibility available")
    exit(0)
}
guard args.count == 3 else { fail("Usage: native.swift doctor | wait|press|menu|confirm|window ROLE LABEL") }
let (verb, role, label) = (args[0], args[1], args[2])
let deadline = ProcessInfo.processInfo.systemUptime + 20
repeat {
    for window in value(root, kAXWindowsAttribute) as? [AXUIElement] ?? [] {
        guard let item = find(window, role: role, label: label) else { continue }
        switch verb {
        case "y":
            guard let bounds = value(item, kAXPositionAttribute) else { fail("Missing row position") }
            var point = CGPoint.zero
            guard AXValueGetValue(bounds as! AXValue, .cgPoint, &point) else { fail("Cannot read row position") }
            print(point.y)
            exit(0)
        case "wait": break
        case "actions":
            for down in [true, false] {
                guard let event = CGEvent(keyboardEventSource: nil, virtualKey: 40, keyDown: down) else { fail("Cannot create Command-K event") }
                event.flags = .maskCommand
                event.postToPid(raycast.processIdentifier)
            }
        case "confirm":
            guard let button = find(window, role: kAXButtonRole, label: "Run Command") else { continue }
            guard AXUIElementPerformAction(button, kAXPressAction as CFString) == .success else { fail("Run Command failed") }
        case "press":
            // Raycast acknowledges AXPress on menu items without activating them.
            guard NSWorkspace.shared.frontmostApplication?.processIdentifier == raycast.processIdentifier,
                  role == kAXMenuItemRole, let pos = value(item, kAXPositionAttribute),
                  let bounds = value(item, kAXSizeAttribute) else { fail("Missing menu item bounds") }
            var point = CGPoint.zero, size = CGSize.zero
            guard AXValueGetValue(pos as! AXValue, .cgPoint, &point),
                  AXValueGetValue(bounds as! AXValue, .cgSize, &size), size.width > 0, size.height > 0
            else { fail("Invalid menu item bounds") }
            let center = CGPoint(x: point.x + size.width / 2, y: point.y + size.height / 2)
            var hit: AXUIElement?
            var owner: pid_t = 0
            guard AXUIElementCopyElementAtPosition(AXUIElementCreateSystemWide(), Float(center.x), Float(center.y), &hit) == .success,
                  let hit, AXUIElementGetPid(hit, &owner) == .success, owner == raycast.processIdentifier
            else { fail("The target is obscured. Leave the verification window visible.") }
            for type in [CGEventType.leftMouseDown, .leftMouseUp] {
                guard let event = CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: center, mouseButton: .left)
                else { fail("Cannot activate " + label) }
                event.post(tap: .cghidEventTap)
                Thread.sleep(forTimeInterval: 0.06)
            }
        case "menu":
            guard let parent = value(item, kAXParentAttribute),
                  AXUIElementPerformAction(parent as! AXUIElement, kAXShowMenuAction as CFString) == .success
            else { fail("Could not show the menu for " + label) }
        case "window":
            guard let axPosition = value(window, kAXPositionAttribute), let axSize = value(window, kAXSizeAttribute)
            else { fail("Missing Raycast window bounds") }
            var point = CGPoint.zero, size = CGSize.zero
            AXValueGetValue(axPosition as! AXValue, .cgPoint, &point)
            AXValueGetValue(axSize as! AXValue, .cgSize, &size)
            let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
            let matches = list.filter { info in
                guard info[kCGWindowOwnerPID as String] as? Int32 == raycast.processIdentifier,
                      let bounds = info[kCGWindowBounds as String] as? [String: Double] else { return false }
                return abs((bounds["X"] ?? -1) - point.x) < 2 && abs((bounds["Y"] ?? -1) - point.y) < 2 &&
                    abs((bounds["Width"] ?? -1) - size.width) < 2 && abs((bounds["Height"] ?? -1) - size.height) < 2
            }
            guard matches.count == 1, let id = matches[0][kCGWindowNumber as String] as? Int else { fail("Could not identify a unique Raycast window for capture") }
            print(id)
            exit(0)
        default: fail("Unknown native operation: " + verb)
        }
        print(verb, role, label)
        exit(0)
    }
    Thread.sleep(forTimeInterval: 0.1)
} while ProcessInfo.processInfo.systemUptime < deadline
fail("Timed out: " + args.joined(separator: " "))
