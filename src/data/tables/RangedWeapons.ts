export default {
    name: "Ranged Weapons",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "169"
        }
    ],
    table: {
        headers:
            ["Type", "Damage", "Ranges", "Clip", "Strength", "Size", "Cost", "Example"],
        rows: [
            ["Revolver, Lt.", "2", "20/40/80", "6", "2", "1", "••", "SW M640 (.38 Special)"],
            ["Revolver, Hvy.", "3", "35/70/140", "6", "3", "1", "••", "SW M29 (.44 Magnum)"],
            ["Pistol, Lt.", "2", "20/40/80", "17+1", "2", "1", "•••", "Glock 17 (9mm)"],
            ["Pistol, Hvy.", "3", "30/60/120", "7+1", "3", "1", "•••", "Colt M1911A1 (.45 ACP)"],
            ["Rifle†", "5", "200/400/800", "5+1", "2", "3", "••", "Remington M-700 (30.06)"],
            ["SMG, Small*", "2", "25/50/100", "30+1", "2", "1", "•••", "Ingram Mac-10 (9mm)"],
            ["SMG, Large*†", "3", "50/100/200", "30+1", "3", "2", "•••", "HK MP-5 (9mm)"],
            ["Assault Rifle*†", "4", "150/300/600", "42+1", "3", "3", "•••", "Steyr-Aug (5.56mm)"],
            ["Shotgun†", "4***", "20/40/80", "5+1", "3", "2", "••", "Remington M870 (12-Gauge)"],
            ["Crossbow**†", "3", "40/80/160", "1", "3", "3", "•••", ""]
        ]

    }
}