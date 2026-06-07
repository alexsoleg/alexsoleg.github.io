---
layout: about
title: about
permalink: /
subtitle: "PhD candidate in machine learning at Universitat Politècnica de Catalunya, working on graph learning for molecular and crystalline systems."

profile:
  align: right
  image: prof_pic.png
  image_circular: false # crops the image to make it circular
  # more_info: >

selected_papers: true # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page

announcements:
  enabled: true # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 6 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: false
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

<div class="intro-copy" markdown="1">

I am a PhD candidate at the [Image Processing Group](https://imatge.upc.edu/web/) at Universitat Politècnica de Catalunya (UPC), supervised by Javier Ruiz-Hidalgo and Eliseo Ruiz. My work focuses on graph neural networks, self-supervised learning, and machine learning models for molecular and crystalline systems.

My current research asks how structural information can be encoded so that models learn useful representations for materials, molecular qubits, and multiscale physical systems. Recent work includes CartNet for thermal ellipsoid estimation, PRISM for crystal property prediction, and new preprints on multiscale interactions and unsupervised atomic embeddings.

Before the PhD, I worked on computer vision and remote sensing at Vicomtech, TU Delft, and Istituto Italiano di Tecnologia. I received my MSc in Telecommunications Engineering and BSc in Telecommunications Technologies and Services Engineering from UPC, with research stays at Télécom ParisTech, TU Delft, and the University of Luxembourg.

</div>

<div class="research-grid">
  <div class="research-card">
    <i class="fa-solid fa-diagram-project"></i>
    <h3>Graph learning for materials</h3>
    <p>Crystal and molecular graphs need geometry, chemistry, and periodic structure. My work builds models that encode these constraints directly.</p>
  </div>
  <div class="research-card">
    <i class="fa-solid fa-atom"></i>
    <h3>Molecular and crystalline systems</h3>
    <p>I work with collaborators in computational chemistry on property prediction, thermal motion, molecular qubits, and force-field learning.</p>
  </div>
  <div class="research-card">
    <i class="fa-solid fa-layer-group"></i>
    <h3>Self-supervised representations</h3>
    <p>I am interested in pretraining and multiscale representations that use unlabeled structure before labeled data becomes available.</p>
  </div>
</div>

<div class="profile-links">
  <a class="btn btn-sm z-depth-0" href="{{ '/publications/' | relative_url }}">publications</a>
  <a class="btn btn-sm z-depth-0" href="{{ '/projects/' | relative_url }}">research projects</a>
  <a class="btn btn-sm z-depth-0" href="{{ '/cv/' | relative_url }}">cv</a>
</div>
