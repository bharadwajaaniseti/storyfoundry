# Character Editor Guide

## Overview

The new Character Editor provides a comprehensive interface for creating and editing characters in your novel, similar to Campfire Write. When you click "New Character" in the novel editor, instead of a simple alert, you'll see a full-screen character creation interface.

## Features

### 1. Multi-Panel Layout
- **Basic Information**: Core character details like name, origin, residence, etc.
- **Bio**: Free-form text area for character backstory and notes
- **Physical Traits**: Character appearance and physical characteristics
- **Personality Traits**: Character psychology and behavior
- **Statistics**: Numerical attributes for game-like systems
- **Links**: Connections to other characters and elements

### 2. Resizable Panels
Each panel can be expanded/collapsed and contains relevant attributes for that category.

### 3. Customizable Attributes
- Click the "+" icon on any panel to add new attributes
- Choose from a comprehensive list of predefined attributes
- Different attribute types:
  - **Text**: Single-line text input
  - **Multi-Text**: Multi-line textarea
  - **Number**: Numerical values with units

### 4. Attribute Categories
The system includes several attribute categories:

#### Basic Information
- Full Name, Origin Country, Place of Residence
- Gender, Formal Education, Occupation
- Age, Height, Weight, Birth Date/Place
- Nationality, Ethnicity, Religion
- Political Affiliation, Social Class, Marital Status

#### Physical Traits
- Hair Color, Eye Color, Skin Tone, Build
- Facial Features, Distinguishing Marks
- Posture, Gait, Voice, Accent
- Clothing Style, Accessories

#### Personality Traits
- Core Personality Traits, Strengths, Weaknesses
- Fears, Desires, Motivations
- Habits, Quirks, Hobbies, Interests
- Values, Beliefs, Mental Health

#### Statistics
- Intelligence, Wisdom, Charisma
- Strength, Dexterity, Constitution
- Willpower, Perception, Luck, Health

#### Additional Categories
- Career & Professional Life
- Hobbies & Interests
- Magical & Martial Abilities
- Relationships
- Game Attributes
- Utilities (Notes, References, etc.)

## How to Use

### Creating a New Character
1. Open the novel editor
2. In the World Building sidebar, expand "Characters"
3. Click "Add Character"
4. The character editor will open in the main content area
5. Fill in the character details across different panels
6. Click "Save" to create the character

### Editing an Existing Character
1. In the World Building sidebar, click on an existing character
2. The character editor will open with the character's current data
3. Make your changes across the different panels
4. Click "Save" to update the character

### Adding Custom Attributes
1. In any panel (except Bio), click the "+" icon
2. A modal will open showing available attributes for that category
3. Check the attributes you want to add
4. Click "Select Attributes" to add them to the panel
5. The new attributes will appear as editable fields

### Managing Attributes
- Each attribute has a remove button (×) to delete it from the panel
- You can see which attributes are currently selected in the modal
- Attributes maintain their data type (text, multi-text, or number)

## Technical Details

### Data Structure
Characters are stored as World Elements with:
- `category`: "characters"
- `name`: Character name
- `description`: Bio content
- `attributes.sections`: Array of character sections and their attributes
- `attributes.image_url`: Character image (future feature)

### Integration
- Characters integrate seamlessly with the existing World Building system
- Character data is saved to the `world_elements` table
- The character editor replaces the main content area when active
- Full integration with the novel editor's save/navigation system

## Future Enhancements

1. **Image Upload**: Character portraits and image gallery
2. **Relationship Links**: Visual connections between characters
3. **Templates**: Pre-built character templates for different genres
4. **Export/Import**: Share character data between projects
5. **Timeline Integration**: Character events and development tracking
6. **Advanced Statistics**: Custom stat systems and calculations
