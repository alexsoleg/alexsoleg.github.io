---
layout: page
title: Projects
permalink: /projects/
description: Academic research projects, code, and personal creative work.
body_class: projects-page
nav: true
nav_order: 3
editorial_motion: true
display_categories: [academic, fun]
horizontal: false
---

<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  {% for category in page.display_categories %}
  <section class="project-section project-section--{{ category }}" id="{{ category }}" aria-labelledby="{{ category }}-title">
  <header class="project-section__header">
    {% if category == "fun" %}
      {% assign category_label = "for fun" %}
      {% assign category_description = "Film, music, and collaborative experiments away from the lab." %}
    {% else %}
      {% assign category_label = category %}
      {% assign category_description = "Graph learning across atomistic structure, properties, and dynamics." %}
    {% endif %}
    <h2 id="{{ category }}-title" class="category">{{ category_label }}</h2>
    <p>{{ category_description }}</p>
  </header>
  {% assign categorized_projects = site.projects | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="project-grid project-grid--{{ category }}">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  </section>
  {% endfor %}
{% else %}
{% assign sorted_projects = site.projects | sort: "importance" %}
{% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
{% else %}
  <div class="project-grid">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
{% endif %}
{% endif %}
</div>
