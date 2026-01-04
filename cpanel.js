const fetch = require("node-fetch").default;

module.exports = function (app) {
    app.get("/api/createpanel", async (req, res) => {
        try {
            const {
                domain,
                apikey,
                capikey,
                egg,
                nestid,
                loc,
                username,
                password,
                email,
                docker_image,
                ram,
                disk,
                cpu
            } = req.query;

            if (
                !domain ||
                !apikey ||
                !capikey ||
                !egg ||
                !nestid ||
                !loc ||
                !username ||
                !password ||
                !email
            ) {
                return res.status(400).json({
                    status: false,
                    error: "Missing required query parameters!"
                });
            }

            // STEP 1: Buat USER
            const createUser = await fetch(`${domain}/api/application/users`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apikey}`
                },
                body: JSON.stringify({
                    email: email,
                    username: username.toLowerCase(),
                    first_name: username,
                    last_name: "Server",
                    language: "en",
                    password: password
                })
            });

            const userData = await createUser.json();
            if (userData.errors) {
                return res.status(500).json({
                    status: false,
                    error: userData.errors[0].detail || "Gagal membuat user"
                });
            }

            const usr_id = userData.attributes.id;

            // STEP 2: Ambil STARTUP CMD
            const startupFetch = await fetch(
                `${domain}/api/application/nests/${nestid}/eggs/${egg}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apikey}`
                    }
                }
            );

            const eggData = await startupFetch.json();
            const startup_cmd = eggData?.attributes?.startup || "npm start";
            const desc = "Panel Created via Website";

            // STEP 3: Buat SERVER PANEL
            const createServer = await fetch(
                `${domain}/api/application/servers`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apikey}`
                    },
                    body: JSON.stringify({
                        name: username,
                        description: desc,
                        user: usr_id,
                        egg: parseInt(egg),
                        docker_image:
                            docker_image || "ghcr.io/parkervcp/yolks:nodejs_20",
                        startup: startup_cmd,
                        environment: {
                            INST: "npm",
                            USER_UPLOAD: "0",
                            AUTO_UPDATE: "0",
                            CMD_RUN: "npm start"
                        },
                        limits: {
                            memory: parseInt(ram),
                            swap: 0,
                            disk: parseInt(disk),
                            io: 500,
                            cpu: parseInt(cpu)
                        },
                        feature_limits: {
                            databases: 5,
                            backups: 5,
                            allocations: 5
                        },
                        deploy: {
                            locations: [parseInt(loc)],
                            dedicated_ip: false,
                            port_range: []
                        }
                    })
                }
            );

            const serverData = await createServer.json();
            if (serverData.errors) {
                return res.status(500).json({
                    status: false,
                    error:
                        serverData.errors[0].detail ||
                        "Gagal membuat server panel"
                });
            }

            res.json({
                status: true,
                message: "Berhasil membuat user dan panel",
                user_id: usr_id,
                server_id: serverData.attributes.id,
                server_name: serverData.attributes.name
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });
};
