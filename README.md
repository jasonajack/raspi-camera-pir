# Raspberry Pi Camera/PIR Monitor

Captures RaspiVid as images when motion is detected on the Raspi PIR and stores in MongoDB.  This requires a MongoDB server be installed somewhere accessible on the same network as the Pi.

# Building the Chassis

1. Review the [RPi-KittyCam Circuit Building Instructions](https://github.com/girliemac/RPi-KittyCam#building-the-circuit) for the components involved in building the Pi circuit.

1. Use the SmartiPi case ([LEGO compatible SmartiPi Raspberry Pi B+,2, and 3 w/ camera case and GoPro compatible mount – Gray](http://a.co/c6ul3AQ)) and assemble with Pi and Camera board module.

1. Follow instructions found for [Lego PIR Housing](http://www.instructables.com/id/Lego-PIR-Housing/) (instructables member [tocsik](http://www.instructables.com/member/tocsik/)) to build the PIR housing and mount to SmartiPi case.

1. Use the GoPro grab bag of mounts to mount the chassis to the wall: [GoPro Grab Bag](http://a.co/j6OIIT2)

# Installing on Raspi Ubuntu

Follow the steps below to install the backend service to a fresh Raspberry Pi:

1. Install [Ubuntu on Raspberry Pi](https://ubuntu-mate.org/raspberry-pi/) using the process described in the guide.

1. Next, install Git as follows:

    ```bash
    sudo apt-get update -y
    sudo apt-get upgrade -y
    sudo apt-get autoremove -y
    sudo apt-get install -y git
    ```

1. Clone this repository (e.g. `git clone git@github.com:jasonajack/raspi-camera-pir.git`).

1. Install the `raspivid` utility:

    ```bash
    ./install-raspivid-ubuntu.sh
    ```

1. Change run-level to not boot the graphical user interface (saves resources):

    ```bash
    sudo systemctl set-default multi-user.target
    ```

1. Configure the WPA Supplicant service for your `wlan0` device to enable connecting to a WiFi network on boot:

    _NOTE: If you don't use WPA Supplicant, Ubuntu forces you to use it's horrible NetworkManager service which forces you to login first before it connects to WiFi; so we swap out NetworkManager for WPA Supplicant which connects automatically at boot time._

    1. Modify the network interfaces configuration file (`sudo vim /etc/network/interfaces`) and append the following to the file:

        ```bash
        # Setup wlan0
        #auto wlan0
        allow-hotplug wlan0
        iface wlan0 inet dhcp
        wpa-conf /etc/wpa_supplicant/wpa_supplicant.conf
        iface default inet dhcp
        ```

    1. Create the new `wpa_supplicant.conf` file (`sudo vim /etc/wpa_supplicant/wpa_supplicant.conf`):

        ```bash
        country=US
        ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
        update_config=1

        network={
          ssid="WirelessRouterName"
          psk="secretpassword"
          key_mgmt=WPA-PSK
        }
        ```

        _NOTE: The password is in plain text, which isn't usually good (and for some reason, password hashes didn't work for me), but you can protect the file so only `root` can read it, which should be good enough._

    1. Protect your password by making the file read-only by `root` user exclusively:  `sudo chmod go-rw /etc/wpa_supplicant/wpa_supplicant.conf`

    1. Enable the WPA supplicant service:

        ```bash
        sudo systemctl start wpa_supplicant
        sudo systemctl enable wpa_supplicant
        ```

    1. Stop and disable the NetworkManager service, because it interferes with the WPA Supplicant service:

        ```bash
        sudo systemctl stop NetworkManager
        sudo systemctl disable NetworkManager
        ```

    1. Test by rebooting and then checking `ip addr`:

        ```bash
        sudo reboot now

        ### After reboot...
        ip addr
        ```

1. Install the camera module as a Systemd service:

    ```bash
    ./install-systemd.sh
    ```

1. Alternatively you can run by hand:

    ```bash
    ./run.sh
    ```

1. Verify the service is running:

    ```bash
    journalctl -u raspi-camera-pir -f
    ```

# Credits

This module was inspired by the [RPi-KittyCam](https://github.com/girliemac/RPi-KittyCam) module for giving me the idea of using the RPi for motion-triggered video capture.

