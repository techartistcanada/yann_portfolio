import { ArrowLeft } from "lucide-react";

const assetBase = "/projects/pie_menu";

const Section = ({ title, children }) => (
  <section className="border-t border-border/40 py-12">
    <h2 className="mb-6 text-3xl font-bold text-primary glow-text">{title}</h2>
    {children}
  </section>
);

const Subsection = ({ title, children }) => (
  <div className="rounded-xl glass p-6">
    <h3 className="mb-4 text-xl font-semibold text-foreground">{title}</h3>
    {children}
  </div>
);

const BulletList = ({ items }) => (
  <ul className="space-y-3 text-foreground/85">
    {items.map((item) => (
      <li key={item} className="flex gap-3 leading-relaxed">
        <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const MediaImage = ({ src, alt }) => (
  <div className="mt-6 overflow-hidden rounded-xl glass">
    <img src={src} alt={alt} className="w-full object-cover" />
  </div>
);

const MediaVideo = ({ src, title }) => (
  <div className="mt-6 overflow-hidden rounded-xl glass">
    <video
      className="aspect-video w-full object-cover"
      src={src}
      title={title}
      controls
      playsInline
      preload="metadata"
    />
  </div>
);

export const UnrealPieMenu = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background pt-[73px] text-foreground">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/85 shadow-lg shadow-black/20 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </button>
          <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
            Tech Art UI
          </span>
        </div>
      </div>

      <main className="container mx-auto max-w-5xl px-6 pb-24 pt-16">
        <header className="pb-12">
          <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-6xl">
            <span className="text-primary glow-text">Dynamic Radial Menu System</span>
            <br />
            <span className="font-serif italic font-normal text-white">UE4 / UE5</span>
          </h1>
          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            A high-performance, scalable radial menu system using dynamic mathematical layouts,
            real-time material feedback, and Blueprint Interface based communication.
          </p>
        </header>

        <MediaVideo src={`${assetBase}/piemenu_overview.mp4`} title="Pie menu overview" />

        <Section title="1. Project Overview">
          <p className="text-[0.97rem] leading-[1.85] text-foreground/85">
            This project is a high-performance, scalable Radial Menu (Pie Menu) system developed
            for Unreal Engine. It utilizes dynamic mathematical layouts, real-time material
            feedback, and a decoupled architecture via Blueprint Interfaces to ensure it can be
            integrated into any game genre, such as RPGs or survival builders.
          </p>
        </Section>

        <Section title="2. Core Technical Stack">
          <BulletList
            items={[
              "Unreal Engine Blueprints: Core logic and event handling.",
              "UMG (Unreal Motion Graphics): UI rendering and slot management.",
              "Vector Mathematics: Polar coordinate conversion and trigonometric positioning.",
              "Blueprint Interfaces (BPI): Facilitating communication between the menu and interactable world objects.",
            ]}
          />
        </Section>

        <Section title="3. Mathematical Foundations & Algorithms">
          <div className="space-y-8">
            <Subsection title="A. Polar Coordinate Conversion (GetProperRotation)">
              <p className="mb-5 leading-relaxed text-foreground/85">
                To determine which sector the user is highlighting, the system converts the mouse
                position into an angular value relative to the center of the viewport.
              </p>
              <BulletList
                items={[
                  "Logic: The function constructs two vectors, one from the Mouse Position and one from the Viewport Center, and uses Find Look at Rotation to compute the directional angle between them.",
                  "Angle Extraction: The resulting Yaw value is used as the primary angular measurement.",
                  "Offset Adjustment: A +180-degree offset is applied to align the direction into a consistent [0, 360] range.",
                  "Purpose: This angle serves as the core input for sector detection in the radial menu system.",
                  "Implementation: Refer to the image for the blueprint logic.",
                ]}
              />
              <MediaImage src={`${assetBase}/getproperrotation.png`} alt="GetProperRotation blueprint" />
            </Subsection>

            <Subsection title="B. Dynamic Sector Calculation (GetSectorBounds)">
              <MediaVideo src={`${assetBase}/piemenu_dynamic.mp4`} title="Pie menu dynamic sector demo" />
              <p className="my-5 leading-relaxed text-foreground/85">
                The system dynamically calculates the angular range of each radial menu sector
                based on the total number of menu items.
              </p>
              <BulletList
                items={[
                  "Sector Size: Each sector is evenly divided using 360 / NumSectors.",
                  "Loop-Based Generation: A For Loop iterates through each sector index and calculates its angular center.",
                  "Boundary Calculation: For each sector, the system stores a minimum and maximum angle by subtracting and adding half of the sector size.",
                  "Runtime Usage: These precomputed bounds are later used by GetCurrentSector to determine which menu item is currently highlighted.",
                  "Implementation: Refer to the image for the boundary calculation blueprint.",
                ]}
              />
              <MediaImage src={`${assetBase}/getsectorbounds.png`} alt="GetSectorBounds blueprint" />
            </Subsection>
          </div>
        </Section>

        <Section title="4. System Architecture">
          <div className="space-y-8">
            <Subsection title="A. Dynamic UI Layout (SpawnChildWidgets)">
              <p className="mb-5 leading-relaxed text-foreground/85">
                Child widgets are dynamically spawned and arranged in a circular layout based on
                the number of menu items.
              </p>
              <BulletList
                items={[
                  "Angle Distribution: Each widget is assigned an angle using 360 / Quantity * Index, ensuring even spacing around the circle.",
                  "Directional Calculation: A Rotator is constructed from the angle, and Get Forward Vector is used to derive the direction.",
                  "Positioning: The final position is calculated by offsetting the viewport center with the direction vector scaled by a configurable radius.",
                  "Alignment: Widgets are centered using an alignment of (0.5, 0.5) to ensure proper radial placement.",
                  "Management: Each spawned widget is stored in a Child Array using AddUnique for later updates and cleanup.",
                  "Implementation: Refer to the image for the spawning logic.",
                ]}
              />
              <MediaImage src={`${assetBase}/spawnchildwidgets.png`} alt="SpawnChildWidgets blueprint" />
            </Subsection>

            <Subsection title="B. Real-time Visual Feedback (UpdateSector)">
              <p className="mb-5 leading-relaxed text-foreground/85">
                The radial menu updates its visual feedback in real time based on the current
                mouse direction.
              </p>
              <BulletList
                items={[
                  "Tick Update: The UpdateSector event is called every frame while the radial menu is active.",
                  "Search Angle: The system uses GetProperRotation to calculate the current mouse angle and sends it to the material parameter SearchAngle.",
                  "Sector Detection: GetCurrentSector compares the current angle against the precomputed sector bounds to identify the active sector.",
                  "Active Angle: Once a sector is detected, the system stores its center angle as CurrentSectorAngle.",
                  "Material Feedback: The calculated active sector angle is sent to the dynamic material instance through the ActiveAngle parameter.",
                  "Implementation: Refer to images for the update logic and the sector detection logic.",
                ]}
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <MediaImage src={`${assetBase}/update_sector1.png`} alt="UpdateSector blueprint part 1" />
                <MediaImage src={`${assetBase}/update_sector2.png`} alt="UpdateSector blueprint part 2" />
              </div>
            </Subsection>

            <Subsection title="C. Decoupled Communication (BPI_PieMenu)">
              <p className="mb-5 leading-relaxed text-foreground/85">
                The system uses the BPI_PieMenu interface to interact with the game world without
                hard-coding references.
              </p>
              <BulletList
                items={[
                  "Core Functions: Includes UpdateInteractable, ShowOutline, and Interact to handle different object types (Consumables, Weapons, etc.).",
                  "Implementation: Refer to the image for the interface structure.",
                ]}
              />
              <MediaImage src={`${assetBase}/piemenu_bpi.png`} alt="BPI_PieMenu interface" />
            </Subsection>
          </div>
        </Section>

        <Section title="5. Performance & Optimization">
          <BulletList
            items={[
              "Pre-calculation: Sector bounds are calculated during Preconstruct rather than every frame to save CPU cycles.",
              "Resource Management: The system uses AddUnique for array management to prevent duplicate references.",
              "Memory Safety: Explicitly clears the Child Array List and resets the Active Consumable during destruction to ensure no dangling references.",
            ]}
          />
        </Section>

        <div className="border-t border-border/40 pt-8">
          <button
            onClick={onBack}
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to portfolio
          </button>
        </div>
      </main>
    </div>
  );
};
