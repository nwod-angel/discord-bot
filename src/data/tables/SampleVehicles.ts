export default {
    name: "Sample Vehicles",
    sources: [
        {
            sourceBook: "World of Darkness",
            sourcePage: "147"
        }
    ],
    table: {
        headers: ["Vehicle", "Durability", "Size", "Structure", "Acceleration", "Safe Speed", "Maximum Speed", "Handling"],
        rows: [
            ["Motorcycle", "2", "7", "9", "22", "132 (90 mph)", "235 (160 mph)", "4-5"],
            ["Sports Car", "2", "10", "12", "20", "161 (110 mph)", "235 (160 mph)", "4"],
            ["Compact Car", "3", "9", "12", "15", "103 (70 mph)", "191 (130 mph)", "3"],
            ["Mid-Sized Car (Sedan)", "3", "12", "15", "14", "110 (75 mph)", "183 (125 mph)", "2-3"],
            ["Full-Sized Car (Family Vehicle)", "3", "14", "17", "12", "103 (70 mph)", "176 (120 mph)", "1"],
            ["SUV/Pick-up Truck", "3", "15", "18", "13", "103 (70 mph)", "169 (115 mph)", "0"],
            ["18-Wheeler (rig only; no trailer)", "3", "18", "21", "10", "103 (70 mph)", "161 (110 mph)", "-1"],
            ["Bus", "3", "21", "24", "10", "88 (60 mph)", "147 (100 mph)", "-2"]
          ]
    }
}