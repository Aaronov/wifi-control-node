// Generated by CoffeeScript 1.10.0
(function() {
  var AirPort, WiFiControlSettings, WiFiLog, WiFiScanner, connectionStateMap, execSync, execSyncToBuffer, fs, parsePatterns, powerStateMap, win32WirelessProfileBuilder;

  WiFiScanner = require('node-wifiscanner2');

  fs = require('fs');

  execSyncToBuffer = require('sync-exec');

  WiFiControlSettings = {
    iface: null,
    debug: false
  };

  parsePatterns = {};

  connectionStateMap = {
    init: "disconnected",
    running: "connected",
    connected: "connected",
    disconnected: "disconnected",
    associating: "connecting",
    connecting: "connecting"
  };

  powerStateMap = {
    On: true,
    Off: false,
    enabled: true,
    disabled: false
  };

  switch (process.platform) {
    case "linux":
      parsePatterns.nmcli_line = new RegExp(/([^:]+):\s+(.*)+/);
      break;
    case "win32":
      parsePatterns.netsh_line = new RegExp(/([^:]+): (.*)+/);
      break;
    case "darwin":
      AirPort = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport";
      parsePatterns.airport_line = new RegExp(/(.*)+: (.*)+/);
  }

  execSync = function(command, options) {
    var results;
    if (options == null) {
      options = {};
    }
    results = execSyncToBuffer(command, options);
    if (!results.status) {
      return results.stdout;
    }
    throw {
      stderr: results.stderr
    };
  };

  WiFiLog = function(msg, error) {
    if (error == null) {
      error = false;
    }
    if (error) {
      return console.error("WiFiControl: " + msg);
    } else {
      if (WiFiControlSettings.debug) {
        return console.log("WiFiControl: " + msg);
      }
    }
  };

  win32WirelessProfileBuilder = function(ssid, security, key) {
    var profile_content;
    if (security == null) {
      security = false;
    }
    if (key == null) {
      key = null;
    }
    profile_content = "<?xml version=\"1.0\"?> <WLANProfile xmlns=\"http://www.microsoft.com/networking/WLAN/profile/v1\"> <name>" + ssid.plaintext + "</name> <SSIDConfig> <SSID> <hex>" + ssid.hex + "</hex> <name>" + ssid.plaintext + "</name> </SSID> </SSIDConfig>";
    switch (security) {
      case "wpa":
        profile_content += "<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPAPSK</authentication> <encryption>TKIP</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>" + key + "</keyMaterial> </sharedKey> </security> </MSM>";
        break;
      case "wpa2":
        profile_content += "<connectionType>ESS</connectionType> <connectionMode>auto</connectionMode> <autoSwitch>true</autoSwitch> <MSM> <security> <authEncryption> <authentication>WPA2PSK</authentication> <encryption>AES</encryption> <useOneX>false</useOneX> </authEncryption> <sharedKey> <keyType>passPhrase</keyType> <protected>false</protected> <keyMaterial>" + key + "</keyMaterial> </sharedKey> </security> </MSM>";
        break;
      default:
        profile_content += "<connectionType>ESS</connectionType> <connectionMode>manual</connectionMode> <MSM> <security> <authEncryption> <authentication>open</authentication> <encryption>none</encryption> <useOneX>false</useOneX> </authEncryption> </security> </MSM>";
    }
    profile_content += "</WLANProfile>";
    return profile_content;
  };

  module.exports = {
    init: function(settings) {
      if (settings == null) {
        settings = {};
      }
      this.configure(settings);
      if (settings.iface == null) {
        return this.findInterface(settings.iface);
      }
    },
    configure: function(settings) {
      if (settings == null) {
        settings = {};
      }
      if (settings.debug != null) {
        WiFiControlSettings.debug = settings.debug;
        WiFiLog("Debug mode set to: " + settings.debug);
      }
      if (settings.iface != null) {
        return this.findInterface(settings.iface);
      }
    },
    findInterface: function(iface) {
      var _iface, _interface, _interfaceLine, _msg, error, error1, findInterfaceCom, interfaceResults, parsedLine;
      if (iface == null) {
        iface = null;
      }
      try {
        if (iface != null) {
          _msg = "Wireless interface manually set to " + iface + ".";
          WiFiLog(_msg);
          WiFiControlSettings.iface = iface;
          return {
            success: true,
            msg: _msg,
            "interface": iface
          };
        }
        WiFiLog("Determining system wireless interface...");
        switch (process.platform) {
          case "linux":
            WiFiLog("Host machine is Linux.");
            findInterfaceCom = "nmcli -m multiline device status | grep wlan";
            WiFiLog("Executing: " + findInterfaceCom);
            _interfaceLine = execSync(findInterfaceCom);
            parsedLine = parsePatterns.nmcli_line.exec(_interfaceLine.trim());
            _interface = parsedLine[2];
            if (_interface) {
              _iface = _interface.trim();
              _msg = "Automatically located wireless interface " + _iface + ".";
              WiFiLog(_msg);
              interfaceResults = {
                success: true,
                msg: _msg,
                "interface": _iface
              };
            } else {
              _msg = "Error: No network interface found.";
              WiFiLog(_msg, true);
              interfaceResults = {
                success: false,
                msg: _msg,
                "interface": null
              };
            }
            break;
          case "win32":
            WiFiLog("Host machine is Windows.");
            findInterfaceCom = "echo wlan";
            WiFiLog("Executing: " + findInterfaceCom);
            _interface = execSync(findInterfaceCom);
            if (_interface) {
              _iface = _interface.trim();
              _msg = "Automatically located wireless interface " + _iface + ".";
              WiFiLog(_msg);
              interfaceResults = {
                success: true,
                msg: _msg,
                "interface": _iface
              };
            } else {
              _msg = "Error: No network interface found.";
              WiFiLog(_msg, true);
              interfaceResults = {
                success: false,
                msg: _msg,
                "interface": null
              };
            }
            break;
          case "darwin":
            WiFiLog("Host machine is MacOS.");
            findInterfaceCom = "networksetup -listallhardwareports | awk '/^Hardware Port: (Wi-Fi|AirPort)$/{getline;print $2}'";
            WiFiLog("Executing: " + findInterfaceCom);
            _interface = execSync(findInterfaceCom);
            if (_interface) {
              _iface = _interface.trim();
              _msg = "Automatically located wireless interface " + _iface + ".";
              WiFiLog(_msg);
              interfaceResults = {
                success: true,
                msg: _msg,
                "interface": _iface
              };
            } else {
              _msg = "Error: No network interface found.";
              WiFiLog(_msg, true);
              interfaceResults = {
                success: false,
                msg: _msg,
                "interface": null
              };
            }
            break;
          default:
            WiFiLog("Unrecognized operating system.  No known method for acquiring wireless interface.");
            interfaceResults = {
              success: false,
              msg: "No valid wireless interface could be located.",
              "interface": null
            };
        }
        WiFiControlSettings.iface = interfaceResults["interface"];
        return interfaceResults;
      } catch (error1) {
        error = error1;
        _msg = "Encountered an error while searching for wireless interface: " + error;
        WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
    },
    scanForWiFi: function(cb) {
      var KEY, VALUE, _msg, _network, c, error, error1, error2, j, k, l, len, len1, ln, networks, nwk, parsedLine, ref, ref1, scanResults;
      if (WiFiControlSettings.iface == null) {
        _msg = "You cannot scan for nearby WiFi networks without a valid wireless interface.";
        WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
      try {
        WiFiLog("Scanning for nearby WiFi Access Points...");
        if (process.platform === "linux") {
          scanResults = execSync("nmcli -m multiline device wifi list");
          networks = [];
          ref = scanResults.split('*:');
          for (c = j = 0, len = ref.length; j < len; c = ++j) {
            nwk = ref[c];
            if (c === 0) {
              continue;
            }
            _network = {};
            ref1 = nwk.split('\n');
            for (k = l = 0, len1 = ref1.length; l < len1; k = ++l) {
              ln = ref1[k];
              try {
                parsedLine = parsePatterns.nmcli_line.exec(ln.trim());
                KEY = parsedLine[1];
                VALUE = parsedLine[2];
              } catch (error1) {
                error = error1;
                continue;
              }
              switch (KEY) {
                case "SSID":
                  _network.ssid = String(VALUE);
                  break;
                case "CHAN":
                  _network.channel = String(VALUE);
                  break;
                case "SIGNAL":
                  _network.signal_level = String(VALUE);
                  break;
                case "SECURITY":
                  _network.security = String(VALUE);
              }
            }
            if (_network.ssid !== "--") {
              networks.push(_network);
            }
          }
          _msg = "Nearby WiFi APs successfully scanned (" + networks.length + " found).";
          WiFiLog(_msg);
          return cb(null, {
            success: true,
            msg: _msg,
            networks: networks
          });
        } else {
          return WiFiScanner.scan(function(err, networks) {
            if (err) {
              _msg = "We encountered an error while scanning for WiFi APs: " + error;
              WiFiLog(_msg, true);
              return cb(err, {
                success: false,
                msg: _msg
              });
            } else {
              _msg = "Nearby WiFi APs successfully scanned (" + networks.length + " found).";
              WiFiLog(_msg);
              return cb(null, {
                success: true,
                networks: networks,
                msg: _msg
              });
            }
          });
        }
      } catch (error2) {
        error = error2;
        _msg = "We encountered an error while scanning for WiFi APs: " + error;
        WiFiLog(_msg, true);
        return cb(error, {
          success: false,
          msg: _msg
        });
      }
    },
    connectToAP: function(_ap) {
      var COMMANDS, _msg, com, connectToAPChain, error, error1, error2, error3, error4, i, ifaceState, j, l, len, ref, ssid, ssidExist, stdout, xmlContent;
      if (WiFiControlSettings.iface == null) {
        _msg = "You cannot connect to a WiFi network without a valid wireless interface.";
        WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
      try {
        if (!_ap.ssid.length) {
          return {
            success: false,
            msg: "Please provide a non-empty SSID."
          };
        }
        if (_ap.password == null) {
          _ap.password = "";
        }
        switch (process.platform) {
          case "linux":
            COMMANDS = {
              "delete": "nmcli connection delete \"" + _ap.ssid + "\"",
              connect: "nmcli device wifi connect \"" + _ap.ssid + "\""
            };
            if (_ap.password.length) {
              COMMANDS.connect += " password \"" + _ap.password + "\"";
            }
            try {
              stdout = execSync("nmcli connection show \"" + _ap.ssid + "\"");
              if (stdout.length) {
                ssidExist = true;
              }
            } catch (error1) {
              error = error1;
              ssidExist = false;
            }
            connectToAPChain = [];
            if (ssidExist) {
              WiFiLog("It appears there is already a connection for this SSID.");
              connectToAPChain.push("delete");
            }
            connectToAPChain.push("connect");
            break;
          case "win32":
            WiFiLog("Generating win32 wireless profile...");
            ssid = {
              plaintext: _ap.ssid,
              hex: ""
            };
            for (i = j = 0, ref = ssid.plaintext.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
              ssid.hex += ssid.plaintext.charCodeAt(i).toString(16);
            }
            xmlContent = null;
            if (_ap.password.length) {
              xmlContent = win32WirelessProfileBuilder(ssid, "wpa2", _ap.password);
            } else {
              xmlContent = win32WirelessProfileBuilder(ssid);
            }
            try {
              fs.writeFileSync(_ap.ssid + ".xml", xmlContent);
            } catch (error2) {
              error = error2;
              _msg = "Encountered an error connecting to AP: " + error;
              WiFiLog(_msg, true);
              return {
                success: false,
                msg: _msg
              };
            }
            COMMANDS = {
              loadProfile: "netsh " + WiFiControlSettings.iface + " add profile filename=\"" + _ap.ssid + ".xml\"",
              connect: "netsh " + WiFiControlSettings.iface + " connect ssid=\"" + _ap.ssid + "\" name=\"" + _ap.ssid + "\""
            };
            connectToAPChain = ["loadProfile", "connect"];
            break;
          case "darwin":
            COMMANDS = {
              connect: "networksetup -setairportnetwork " + WiFiControlSettings.iface + " \"" + _ap.ssid + "\""
            };
            if (_ap.password.length) {
              COMMANDS.connect += " \"" + _ap.password + "\"";
            }
            connectToAPChain = ["connect"];
        }
        for (l = 0, len = connectToAPChain.length; l < len; l++) {
          com = connectToAPChain[l];
          WiFiLog("Executing:\t" + COMMANDS[com]);
          try {
            stdout = execSync(COMMANDS[com]);
          } catch (error3) {
            error = error3;
            if (process.platform === "linux") {
              if (error.stderr.toString().trim() === ("Error: No network with SSID '" + _ap.ssid + "' found.")) {
                _msg = "Error: No network called " + _ap.ssid + " could be found.";
                WiFiLog(_msg, true);
                return {
                  success: false,
                  msg: _msg
                };
              }
              if (!/nmcli device wifi connect/.test(COMMANDS[com])) {
                WiFiLog(error, true);
                return {
                  success: false,
                  msg: error
                };
              }
            }
          }
          switch (process.platform) {
            case "darwin":
              if (stdout === ("Could not find network " + _ap.ssid + ".")) {
                _msg = "Error: No network called " + _ap.ssid + " could be found.";
                WiFiLog(_msg, true);
                return {
                  success: false,
                  msg: _msg
                };
              }
          }
          WiFiLog("Success!");
        }
        if (process.platform === "win32") {
          WiFiLog("Removing temporary WiFi config file...");
          execSync("del \".\\" + _ap.ssid + ".xml\"");
        }
        WiFiLog("Waiting for connection attempt to settle...");
        while (true) {
          ifaceState = this.getIfaceState();
          if (ifaceState.success) {
            if (ifaceState.connection === "connected") {
              break;
            } else if (ifaceState.connection === "disconnected") {
              _msg = "Error: Interface is not currently connected to any wireless AP.";
              WiFiLog(_msg, true);
              return {
                success: false,
                msg: _msg
              };
            }
          }
        }
        if (ifaceState.ssid === _ap.ssid) {
          _msg = "Successfully connected to " + _ap.ssid + "!";
          WiFiLog(_msg);
          return {
            success: true,
            msg: _msg
          };
        } else {
          _msg = "Error: Interface is currently connected to " + ifaceState.ssid;
          WiFiLog(_msg, true);
          return {
            success: false,
            msg: _msg
          };
        }
      } catch (error4) {
        error = error4;
        _msg = "Encountered an error while connecting to " + _ap.ssid + ": " + error;
        WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
    },
    resetWiFi: function() {
      var COMMANDS, _msg, com, error, error1, ifaceState, j, len, resetWiFiChain, stdout;
      try {
        switch (process.platform) {
          case "linux":
            COMMANDS = {
              disableNetworking: "nmcli networking off",
              enableNetworking: "nmcli networking on"
            };
            resetWiFiChain = ["disableNetworking", "enableNetworking"];
            break;
          case "win32":
            COMMANDS = {
              disconnect: "netsh " + WiFiControlSettings.iface + " disconnect"
            };
            resetWiFiChain = ["disconnect"];
            break;
          case "darwin":
            COMMANDS = {
              enableAirport: "networksetup -setairportpower " + WiFiControlSettings.iface + " on",
              disableAirport: "networksetup -setairportpower " + WiFiControlSettings.iface + " off"
            };
            resetWiFiChain = ["disableAirport", "enableAirport"];
        }
        for (j = 0, len = resetWiFiChain.length; j < len; j++) {
          com = resetWiFiChain[j];
          WiFiLog("Executing:\t" + COMMANDS[com]);
          stdout = execSync(COMMANDS[com]);
          _msg = "Success!";
          WiFiLog(_msg);
        }
        WiFiLog("Waiting for interface to finish resetting...");
        while (true) {
          ifaceState = this.getIfaceState();
          if (ifaceState.success) {
            if (ifaceState.power) {
              WiFiLog("Success!  Wireless interface is now reset.");
              break;
            }
          } else {
            _msg = "Error: Interface could not be reset.";
            WiFiLog(_msg, true);
            return {
              success: false,
              msg: _msg
            };
          }
        }
        return {
          success: true,
          msg: "Successfully reset WiFi!"
        };
      } catch (error1) {
        error = error1;
        _msg = "Encountered an error while resetting wireless interface: " + error;
        WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
    },
    getIfaceState: function() {
      var KEY, VALUE, _msg, connectionData, connectionName, error, error1, error2, error3, error4, error5, error6, foundInterface, interfaceState, j, k, l, len, len1, len2, ln, ln_trim, m, parsedLine, powerData, ref, ref1, ref2, ssidData;
      try {
        interfaceState = {};
        switch (process.platform) {
          case "linux":
            powerData = execSync("nmcli networking");
            interfaceState.power = powerStateMap[powerData.trim()];
            if (interfaceState.power) {
              foundInterface = false;
              connectionData = execSync("nmcli -m multiline device status");
              connectionName = null;
              ref = connectionData.split('\n');
              for (k = j = 0, len = ref.length; j < len; k = ++j) {
                ln = ref[k];
                try {
                  parsedLine = parsePatterns.nmcli_line.exec(ln.trim());
                  KEY = parsedLine[1];
                  VALUE = parsedLine[2];
                  if (VALUE === "--") {
                    VALUE = null;
                  }
                } catch (error1) {
                  error = error1;
                  continue;
                }
                switch (KEY) {
                  case "DEVICE":
                    if (VALUE === WiFiControlSettings.iface) {
                      foundInterface = true;
                    }
                    break;
                  case "STATE":
                    if (foundInterface) {
                      interfaceState.connection = connectionStateMap[VALUE];
                    }
                    break;
                  case "CONNECTION":
                    if (foundInterface) {
                      connectionName = VALUE;
                    }
                }
                if (KEY === "CONNECTION" && foundInterface) {
                  break;
                }
              }
              if (!foundInterface) {
                return {
                  success: false,
                  msg: "Unable to retrieve state of network interface " + WiFiControlSettings.iface + "."
                };
              }
              if (connectionName) {
                try {
                  ssidData = execSync("nmcli -m multiline connection show \"" + connectionName + "\" | grep 802-11-wireless.ssid");
                  parsedLine = parsePatterns.nmcli_line.exec(ssidData.trim());
                  interfaceState.ssid = parsedLine[2];
                } catch (error2) {
                  error = error2;
                  return {
                    success: false,
                    msg: "Error while retrieving SSID information of network interface " + WiFiControlSettings.iface + ": " + error.stderr
                  };
                }
              } else {
                interfaceState.ssid = null;
              }
            } else {
              interfaceState.connection = connectionStateMap[VALUE];
              interfaceState.ssid = null;
            }
            break;
          case "win32":
            connectionData = execSync("netsh " + WiFiControlSettings.iface + " show interface");
            ref1 = connectionData.split('\n');
            for (k = l = 0, len1 = ref1.length; l < len1; k = ++l) {
              ln = ref1[k];
              try {
                ln_trim = ln.trim();
                if (ln_trim === "Software Off") {
                  interfaceState = {
                    ssid: null,
                    connected: false,
                    power: false
                  };
                  break;
                } else {
                  parsedLine = parsePatterns.netsh_line.exec(ln_trim);
                  KEY = parsedLine[1].trim();
                  VALUE = parsedLine[2].trim();
                }
              } catch (error3) {
                error = error3;
                continue;
              }
              interfaceState.power = true;
              switch (KEY) {
                case "State":
                  interfaceState.connection = connectionStateMap[VALUE];
                  break;
                case "SSID":
                  interfaceState.ssid = VALUE;
                  break;
                case "Radio status":
                  if (VALUE === "Hardware Off") {
                    interfaceState = {
                      ssid: null,
                      connected: false,
                      power: false
                    };
                    break;
                  }
              }
              if (KEY === "SSID") {
                break;
              }
            }
            break;
          case "darwin":
            connectionData = execSync(AirPort + " -I");
            ref2 = connectionData.split('\n');
            for (k = m = 0, len2 = ref2.length; m < len2; k = ++m) {
              ln = ref2[k];
              try {
                parsedLine = parsePatterns.airport_line.exec(ln.trim());
                KEY = parsedLine[1];
                VALUE = parsedLine[2];
              } catch (error4) {
                error = error4;
                continue;
              }
              switch (KEY) {
                case "state":
                  interfaceState.connection = connectionStateMap[VALUE];
                  break;
                case "SSID":
                  interfaceState.ssid = VALUE;
              }
              if (KEY === "SSID") {
                break;
              }
            }
            powerData = execSync("networksetup -getairportpower " + WiFiControlSettings.iface);
            try {
              parsedLine = parsePatterns.airport_line.exec(powerData.trim());
              KEY = parsedLine[1];
              VALUE = parsedLine[2];
            } catch (error5) {
              error = error5;
              return {
                success: false,
                msg: "Unable to retrieve state of network interface " + WiFiControlSettings.iface + "."
              };
            }
            interfaceState.power = powerStateMap[VALUE];
        }
        return {
          success: true,
          msg: "Successfully acquired state of network interface " + WiFiControlSettings.iface + ".",
          ssid: interfaceState.ssid,
          connection: interfaceState.connection,
          power: interfaceState.power
        };
      } catch (error6) {
        error = error6;
        _msg = "Encountered an error while acquiring network interface connection state: " + error;
        WiFiLog(_msg, true);
        return {
          success: false,
          msg: _msg
        };
      }
    }
  };

}).call(this);
