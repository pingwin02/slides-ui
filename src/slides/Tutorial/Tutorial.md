# Examples

## Slides Examples

Michał Wójcik

---

### Motivation

Why don't want to use WYSIWYG:

* developer most time are dealing with editing sorce codes and navigating between them,
* as far as point and click games are loved, this approach at work is not ergonomic,
* batch updating is at least painful,
* moving/copying content between topics or courses is troublesome,
* sharing content in other forms than slides is impossible without maintaining separate files with the same content.

---

### Markdown

Why use markdown:

* when creating academic slides, fancy animations are not required, this is not advertisement,
* it's simple text format,
* way simpler than LaTeX (bullet list for example),
* slides content can be separated from slides styling and published independently,
* developer platforms (like GitLab) support it and render nice HTML.

---

### Flow

What's the flow:

* select best suited JavaScript presentation engine,
* create HTML+CSS+JS project,
* create HTML+CSS templates,
* fix the engine as it does not meet particular whim,
* implement slides serving logic,
* configure simple HTTP server,
* create HTML to PDF converting script,
* create slides:
  * start HTTP server,
  * display preview in browser,
  * add markdown file for course or topic,
  * add CSS styles if some additional styling is needed,
  * generate PDF.

---

### Title slide

The title slide should have the following format.

```md
# Course name

## Topic

Author
```

---

### Subsequent slides

Subsequent slides can have any content.

```md
### Subsequent slides

Subsequent slides can have any content.
```

---

### Separating slides

Slides are separated with `---`.

```md
# Course name

## Topic

Author

---

### Subsequent slides

Subsequent slides can have any content.
```

---

### Just text

The text may be **bold** or written in *italics* or ***both***.

It may also be in several paragraphs.

```markdown
### Just text

The text may be **bold** or written in *italics* or ***both***.

It may also be in several paragraphs.
```

---

### Table

Tables are made simply.

| Header          | Header        |
|-----------------|---------------|
| entry           | entry         |
| even more entry | another entry |

```markdown
### Table

Tables are made simply.

| Header          | Header        |
|-----------------|---------------|
| entry           | entry         |
| even more entry | another entry |
```

---

### Images

Images (also vectors) are embedded as links with `!`.

![Fox](assets/img/fox.svg)

```markdown
### Images

Images (also vectors) are embedded as links with `!`.

![Fox](assets/img/fox.svg)
```

---

### Diagrams

Diagrams can be implemented using the mermaid library.

---

### Diagrams - flowchart

```mermaid
flowchart TD
    start([Start])
    stop([Stop])
    enter_animal[/Enter animal/]
    is_wolf{is wolf?}
    wolf[/good/]
    not_wolf[/should be wolf/]
    start --> enter_animal
    enter_animal --> is_wolf
    is_wolf -- yes --> wolf
    is_wolf -- no --> not_wolf
    wolf --> stop
    not_wolf --> stop
```

````markdown
```mermaid
flowchart TD
    start([Start])
    stop([Stop])
    enter_animal[/Enter animal/]
    is_wolf{is wolf?}
    wolf[/good/]
    not_wolf[/should be wolf/]
    start --> enter_animal
    enter_animal --> is_wolf
    is_wolf -- yes --> wolf
    is_wolf -- no --> not_wolf
    wolf --> stop
    not_wolf --> stop
```
````

---

### Diagrams - sequence

```mermaid
sequenceDiagram
    Wolf ->> Fox: Woof!
    alt want to play
        Fox ->> Wolf: Bark! Bark!
    else does not want to play
        Fox ->> Wolf: Growl!
    end
```

````markdown
```mermaid
sequenceDiagram
    Wolf ->> Fox: Woof!
    alt want to play
        Fox ->> Wolf: Bark! Bark!
    else does not want to play
        Fox ->> Wolf: Growl!
    end
```
````

---

### Diagrams - class

```mermaid
classDiagram
    Canine <|-- Wolf
    Canine <|-- Fox
    <<abstract>> Canine

    class Canine {
        String name
    }

    class Wolf {
        void howl()
    }

    class Fox {
        void bark()
    }
```

````markdown
```mermaid
classDiagram
    Canine <|-- Wolf
    Canine <|-- Fox
    <<abstract>> Canine

    class Canine {
        String name
    }

    class Wolf {
        void howl()
    }

    class Fox {
        void bark()
    }
```
````

---

### Diagrams - state

```mermaid
stateDiagram
    state is_wolf <<choice>>
    [*] --> enter_animal
    enter_animal --> is_wolf
    is_wolf --> bad : not wolf
    is_wolf --> good : wolf
    bad --> [*]
    good --> [*]
```

````markdown
```mermaid
stateDiagram
    state is_wolf <<choice>>
    [*] --> enter_animal
    enter_animal --> is_wolf
    is_wolf --> bad : not wolf
    is_wolf --> good : wolf
    bad --> [*]
    good --> [*]
```
````

---

### Diagrams - ERD

```mermaid
erDiagram
    PACK {
        uuid id PK
    }
    WOLF {
        uuid id PK 
        uuid pack FK
        varchar name
    }
    WOLF }|--|| PACK : belongs
```

````markdown
```mermaid
erDiagram
    PACK {
        uuid id PK
    }
    WOLF {
        uuid id PK 
        uuid pack FK
        varchar name
    }
    WOLF }|--|| PACK : belongs
```
````

---

### Diagrams - journey

```mermaid
journey
    title Wolf's day
    section Hunt
      Seek prey: 2: Wolf
      Catch: 3: Wolf
      Eat: 5: Wolf
    section Play
      Seek fox: 5: Wolf
      Play: 7: Wolf, Fox
```

````markdown
```mermaid
journey
    title Wolf's day
    section Hunt
      Seek prey: 2: Wolf
      Catch: 3: Wolf
      Eat: 5: Wolf
    section Play
      Seek fox: 5: Wolf
      Play: 7: Wolf, Fox
```
````

---

### Diagrams - Gantt

```mermaid
gantt
    title Project development
    dateFormat YYYY-MM-DD
    section Design
        Get requirements  :d1, 2024-01-01, 3d
        Design UI         :d2, after d1, 4d
    section Development
        Frontend          :after d2, 8d
        Backend           :after d2,8d 
```

````markdown
```mermaid
gantt
    title Project development
    dateFormat YYYY-MM-DD
    section Design
        Get requirements  :d1, 2024-01-01, 3d
        Design UI         :d2, after d1, 4d
    section Development
        Frontend          :after d2, 8d
        Backend           :after d2,8d 
```
````

---

### Diagrams - pie chart

```mermaid
pie title Wild pets in my examples
    "Wolves" : 70
    "Foxes" : 20
    "Rats" : 10
```

````markdown
```mermaid
pie title Wild pets in my examples
    "Wolves" : 70
    "Foxes" : 20
    "Rats" : 10
```
````

---

### Source code

The source code is placed in ` ``` ` specifying the language name.

```java
public class Main {
    public static void main(String[] args) {

    }
}
```

````markdown
The source code is placed in ` ``` ` specifying the language name.

```java
public class Main {
    public static void main(String[] args) {

    }
}
```
````

---

### Styling

Styling slides for PDF generation can be done with CSS.

---

### Styling - floating images

```css
[data-title="Diagrams - flowchart"] div.mermaid,
[data-title="Diagrams - sequence"] div.mermaid,
[data-title="Diagrams - class"] div.mermaid,
[data-title="Diagrams - state"] div.mermaid,
[data-title="Diagrams - ERD"] div.mermaid {
    float: left;
    width: 45%;
    margin-right: 5%;
}
```

---

### Styling - two columns list

Two (or more) columns lists are often used for comparison.

Example pets:

* Wolves:
  * gray,
  * can be deadly.
* Foxes:
  * red,
  * can be harmless.

```markdown
Example pets:

* Wolves:
  * gray,
  * can be deadly.
* Foxes:
  * red,
  * can be harmless.
```

```css
[data-title="Styling - two columns list"] p + ul {
    display: flex;
    justify-content: space-between;
}

[data-title="Styling - two columns list"] p + ul > li {
    width: 45%;
}
```

---

### Styling - image styling

Images can be styled using image `alt` selector.

![Fox](assets/img/fox.svg)

The Fox.

```markdown
![Fox](assets/img/fox.svg)

The Fox.
```

```css
[data-title="Styling - image styling"] img[alt="Fox"] {
  width: 25%;
  margin: auto;
  display: block;
}

[data-title="Styling - image styling"] p:has(img) + p {
  text-align: center;
}
```

---

### Instructions

Firstly, clone this repository:

```bash
git clone https://git.pg.edu.pl/p650304/slides-ui/
```

Then you probably want to add own origin and push it to own git repository.

Start server:

```bash
npm run serve
```

Create course in `src/slides/<course_name>/<course_name>.md`.

Create topic in `src/slides/<course_name>/<topic_name>/<topic_name>.md`.

Create CSS styles in `src/css/slides/<course_name>/<topic_name>/styles.css`, if needed.

Based on examples in `src/slides/Examples` and `src/css/slides/Examples` create own content.

Generate PDF documents:

```bash
bash generate_pdf.sh
```

---

### Helpful resources

Helpful resources:

* <https://www.markdownguide.org/>
* <https://mermaid.js.org/intro/>
* <https://remarkjs.com/>

```markdown
Helpful resources:

* <https://www.markdownguide.org/>
* <https://mermaid.js.org/intro/>
* <https://remarkjs.com/>
```
